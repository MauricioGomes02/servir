import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createAuthenticatedActor,
  createExternalIdentityAssertion,
  parseAuthenticatedUserId,
  parseIdentityIssuer,
  parseIdentitySubject,
} from '@/shared/application/authentication';
import { createExecutionContext, parseCorrelationId } from '@/shared/application/context';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import { FixedClock } from '@/shared/infrastructure/clock';
import { Instant } from '@/shared/domain/instant';
import { ExternalIdentity, User, UserId } from '@/modules/identity/domain';
import {
  AcceptMemberAccessInvitationErrorCodes,
  AcceptMemberAccessInvitationHandler,
  InviteMemberToAccessHandler,
  type MemberAccessInvitationWriteScope,
} from '@/modules/identity/application';
import { MemberAccessInvitationId, OrganizationAccessId } from '@/modules/identity/domain';
import { NodeMemberAccessInvitationTokenService } from '@/modules/identity/infrastructure';
import { OrganizationId } from '@/modules/organizations/domain';
import { requireTestDatabaseUrl } from '@/test-support/postgres-integration';
import { Pool } from 'pg';

import { createPostgresPersistence } from './persistence/create-postgres-persistence';
import {
  memberAccessInvitationUnitOfWork,
  organizationAccessReader,
  userProvisioner,
} from './persistence/identity-persistence-module';
import { accessibleOrganizationListReader } from './persistence/organizations-persistence-module';

const FIRST_USER_ID = '0198f334-6dc5-7c20-9af1-91d7e599e101';
const SECOND_USER_ID = '0198f334-6dc5-7c20-9af1-91d7e599e102';
const ACCESS_ORGANIZATION_ID = '0198f334-6dc5-7c20-9af1-91d7e599e111';
const ACTIVE_ACCESS_USER_ID = '0198f334-6dc5-7c20-9af1-91d7e599e112';
const REVOKED_ACCESS_USER_ID = '0198f334-6dc5-7c20-9af1-91d7e599e113';
const ACTIVE_ACCESS_ID = '0198f334-6dc5-7c20-9af1-91d7e599e114';
const REVOKED_ACCESS_ID = '0198f334-6dc5-7c20-9af1-91d7e599e115';
const LINK_ORGANIZATION_ID = '0198f334-6dc5-7c20-9af1-91d7e599e201';
const LINK_OWNER_USER_ID = '0198f334-6dc5-7c20-9af1-91d7e599e202';
const LINK_MEMBER_USER_ID = '0198f334-6dc5-7c20-9af1-91d7e599e203';
const LINK_FIRST_MEMBER_ID = '0198f334-6dc5-7c20-9af1-91d7e599e204';
const LINK_SECOND_MEMBER_ID = '0198f334-6dc5-7c20-9af1-91d7e599e205';
const LINK_OWNER_ACCESS_ID = '0198f334-6dc5-7c20-9af1-91d7e599e206';
const LINK_FIRST_INVITATION_ID = '0198f334-6dc5-7c20-9af1-91d7e599e207';
const LINK_SECOND_INVITATION_ID = '0198f334-6dc5-7c20-9af1-91d7e599e208';
const LINK_MEMBER_ACCESS_ID = '0198f334-6dc5-7c20-9af1-91d7e599e209';
const LINK_THIRD_USER_ID = '0198f334-6dc5-7c20-9af1-91d7e599e20a';
const LINK_CONFLICT_ACCESS_ID = '0198f334-6dc5-7c20-9af1-91d7e599e20b';
const LINK_OTHER_ORGANIZATION_ID = '0198f334-6dc5-7c20-9af1-91d7e599e20c';
const LINK_OTHER_MEMBER_ID = '0198f334-6dc5-7c20-9af1-91d7e599e20d';
const LINK_CROSS_TENANT_INVITATION_ID = '0198f334-6dc5-7c20-9af1-91d7e599e20e';

function value<T>(result: { success: true; value: T } | { success: false }): T {
  if (!result.success) throw new Error('Invalid deterministic integration fixture');
  return result.value;
}

describe('PostgreSQL user provisioning', () => {
  it('returns one global user for concurrent attempts with the same external identity', async (testContext) => {
    const databaseUrl = requireTestDatabaseUrl();
    const pool = new Pool({ connectionString: databaseUrl });
    const persistence = createPostgresPersistence(databaseUrl);
    const identity = createExternalIdentityAssertion({
      issuer: value(parseIdentityIssuer('https://identity.integration.example.com')),
      subject: value(parseIdentitySubject('concurrent-user')),
    });
    const externalIdentity = value(ExternalIdentity.create(identity));
    const candidates = [
      User.provision(value(UserId.create(FIRST_USER_ID)), externalIdentity),
      User.provision(value(UserId.create(SECOND_USER_ID)), externalIdentity),
    ];

    async function cleanup(): Promise<void> {
      await pool.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [
        [FIRST_USER_ID, SECOND_USER_ID],
      ]);
    }

    await cleanup();
    testContext.after(async () => {
      await cleanup();
      await persistence.close();
      await pool.end();
    });

    const provisioner = persistence.services.get(userProvisioner);
    const results = await Promise.all(
      candidates.map((candidate) => provisioner.provision(candidate)),
    );

    assert.equal(results.filter((result) => result.created).length, 1);
    assert.equal(results.filter((result) => !result.created).length, 1);
    assert.equal(results[0]?.user.id.equals(results[1]?.user.id), true);

    const storedUsers = await pool.query(
      `SELECT u.id
         FROM users u
         JOIN user_external_identities i ON i.user_id = u.id
        WHERE i.issuer = $1 AND i.subject = $2`,
      [identity.issuer, identity.subject],
    );
    assert.equal(storedUsers.rowCount, 1);

    const orphan = await pool.query(
      `SELECT id FROM users
        WHERE id = ANY($1::uuid[])
          AND NOT EXISTS (
            SELECT 1 FROM user_external_identities i WHERE i.user_id = users.id
          )`,
      [[FIRST_USER_ID, SECOND_USER_ID]],
    );
    assert.equal(orphan.rowCount, 0);
  });
});

describe('PostgreSQL organization access reader', () => {
  it('allows only the user with active access to the requested organization', async (testContext) => {
    const databaseUrl = requireTestDatabaseUrl();
    const pool = new Pool({ connectionString: databaseUrl });
    const persistence = createPostgresPersistence(databaseUrl);

    async function cleanup(): Promise<void> {
      await pool.query('DELETE FROM organization_accesses WHERE organization_id = $1', [
        ACCESS_ORGANIZATION_ID,
      ]);
      await pool.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [
        [ACTIVE_ACCESS_USER_ID, REVOKED_ACCESS_USER_ID],
      ]);
      await pool.query('DELETE FROM organizations WHERE id = $1', [ACCESS_ORGANIZATION_ID]);
    }

    await cleanup();
    testContext.after(async () => {
      await cleanup();
      await persistence.close();
      await pool.end();
    });

    await pool.query('INSERT INTO organizations (id, name) VALUES ($1, $2)', [
      ACCESS_ORGANIZATION_ID,
      'Organization access integration fixture',
    ]);
    await pool.query('INSERT INTO users (id, status) VALUES ($1, 1), ($2, 1)', [
      ACTIVE_ACCESS_USER_ID,
      REVOKED_ACCESS_USER_ID,
    ]);
    await pool.query(
      `INSERT INTO organization_accesses (id, organization_id, user_id, role, status)
       VALUES ($1, $2, $3, 'owner', 'active'), ($4, $2, $5, 'owner', 'revoked')`,
      [
        ACTIVE_ACCESS_ID,
        ACCESS_ORGANIZATION_ID,
        ACTIVE_ACCESS_USER_ID,
        REVOKED_ACCESS_ID,
        REVOKED_ACCESS_USER_ID,
      ],
    );

    const reader = persistence.services.get(organizationAccessReader);
    const organizationId = value(OrganizationId.create(ACCESS_ORGANIZATION_ID));
    const activeUserId = value(UserId.create(ACTIVE_ACCESS_USER_ID));
    const revokedUserId = value(UserId.create(REVOKED_ACCESS_USER_ID));

    assert.equal(await reader.hasActiveAccess(organizationId, activeUserId), true);
    assert.equal(await reader.hasActiveAccess(organizationId, revokedUserId), false);

    const organizationReader = persistence.services.get(accessibleOrganizationListReader);
    const activeOrganizations = await organizationReader.listByUserId(activeUserId);
    const revokedOrganizations = await organizationReader.listByUserId(revokedUserId);
    assert.deepEqual(
      activeOrganizations.map((organization) => ({
        id: organization.id.toString(),
        name: organization.name,
      })),
      [
        {
          id: ACCESS_ORGANIZATION_ID,
          name: 'Organization access integration fixture',
        },
      ],
    );
    assert.deepEqual(revokedOrganizations, []);
  });
});

describe('PostgreSQL member access invitation workflow', () => {
  it('persists only the digest, updates an existing access, rolls back, and serializes acceptance', async (testContext) => {
    const databaseUrl = requireTestDatabaseUrl();
    const pool = new Pool({ connectionString: databaseUrl });
    const persistence = createPostgresPersistence(databaseUrl);
    const tokenService = new NodeMemberAccessInvitationTokenService();
    const fixedNow = value(Instant.create('2026-08-20T12:00:00.000Z'));
    const clock = new FixedClock(fixedNow);
    const ownerContext = createExecutionContext({
      actor: createAuthenticatedActor(value(parseAuthenticatedUserId(LINK_OWNER_USER_ID))),
      correlationId: value(parseCorrelationId('identity-link-owner')),
    });
    const memberContext = createExecutionContext({
      actor: createAuthenticatedActor(value(parseAuthenticatedUserId(LINK_MEMBER_USER_ID))),
      correlationId: value(parseCorrelationId('identity-link-member')),
    });

    async function cleanup(): Promise<void> {
      await pool.query('DELETE FROM member_access_invitations WHERE organization_id = $1', [
        LINK_ORGANIZATION_ID,
      ]);
      await pool.query('DELETE FROM organization_accesses WHERE organization_id = $1', [
        LINK_ORGANIZATION_ID,
      ]);
      await pool.query('DELETE FROM members WHERE organization_id = $1', [LINK_ORGANIZATION_ID]);
      await pool.query('DELETE FROM members WHERE organization_id = $1', [
        LINK_OTHER_ORGANIZATION_ID,
      ]);
      await pool.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [
        [LINK_OWNER_USER_ID, LINK_MEMBER_USER_ID, LINK_THIRD_USER_ID],
      ]);
      await pool.query('DELETE FROM organizations WHERE id = $1', [LINK_ORGANIZATION_ID]);
      await pool.query('DELETE FROM organizations WHERE id = $1', [LINK_OTHER_ORGANIZATION_ID]);
    }

    await cleanup();
    testContext.after(async () => {
      await cleanup();
      await persistence.close();
      await pool.end();
    });

    await pool.query('INSERT INTO organizations (id, name) VALUES ($1, $2), ($3, $4)', [
      LINK_ORGANIZATION_ID,
      'Member access invitation integration fixture',
      LINK_OTHER_ORGANIZATION_ID,
      'Other member access invitation organization',
    ]);
    await pool.query('INSERT INTO users (id, status) VALUES ($1, 1), ($2, 1), ($3, 1)', [
      LINK_OWNER_USER_ID,
      LINK_MEMBER_USER_ID,
      LINK_THIRD_USER_ID,
    ]);
    await pool.query(
      `INSERT INTO members (id, organization_id, name, status, registered_at)
       VALUES ($1, $3, 'First linked member', 1, $4),
              ($2, $3, 'Second linked member', 1, $4)`,
      [LINK_FIRST_MEMBER_ID, LINK_SECOND_MEMBER_ID, LINK_ORGANIZATION_ID, fixedNow.toISOString()],
    );
    await pool.query(
      `INSERT INTO members (id, organization_id, name, status, registered_at)
       VALUES ($1, $2, 'Other organization member', 1, $3)`,
      [LINK_OTHER_MEMBER_ID, LINK_OTHER_ORGANIZATION_ID, fixedNow.toISOString()],
    );
    await pool.query(
      `INSERT INTO organization_accesses (id, organization_id, user_id, role, status)
       VALUES ($1, $2, $3, 'owner', 'active')`,
      [LINK_OWNER_ACCESS_ID, LINK_ORGANIZATION_ID, LINK_OWNER_USER_ID],
    );

    const invitationUnitOfWork = persistence.services.get(memberAccessInvitationUnitOfWork);
    const inviteFirst = new InviteMemberToAccessHandler({
      clock,
      invitationIdGenerator: {
        generate: () => value(MemberAccessInvitationId.create(LINK_FIRST_INVITATION_ID)),
      },
      tokenDigester: tokenService,
      tokenGenerator: { generate: () => 'raw-integration-token-first' },
      unitOfWork: invitationUnitOfWork,
    });
    const firstInvitation = await inviteFirst.handle(
      { organizationId: LINK_ORGANIZATION_ID, memberId: LINK_FIRST_MEMBER_ID },
      ownerContext,
    );
    assert.equal(firstInvitation.success, true);
    if (!firstInvitation.success) return;

    const storedInvitation = await pool.query<{
      token_digest: string;
    }>('SELECT token_digest FROM member_access_invitations WHERE id = $1', [
      LINK_FIRST_INVITATION_ID,
    ]);
    assert.equal(storedInvitation.rowCount, 1);
    assert.equal(
      storedInvitation.rows[0]?.token_digest,
      tokenService.digest(firstInvitation.value.rawToken).toString(),
    );
    assert.notEqual(storedInvitation.rows[0]?.token_digest, firstInvitation.value.rawToken);

    const acceptOwner = new AcceptMemberAccessInvitationHandler({
      clock,
      organizationAccessIdGenerator: {
        generate: () => value(OrganizationAccessId.create(LINK_MEMBER_ACCESS_ID)),
      },
      tokenDigester: tokenService,
      unitOfWork: invitationUnitOfWork,
    });
    assert.equal(
      (await acceptOwner.handle({ token: firstInvitation.value.rawToken }, ownerContext)).success,
      true,
    );
    const linkedOwner = await pool.query<{
      id: string;
      member_id: string;
      role: string;
      status: string;
    }>(
      `SELECT id, member_id, role, status FROM organization_accesses
        WHERE organization_id = $1 AND user_id = $2`,
      [LINK_ORGANIZATION_ID, LINK_OWNER_USER_ID],
    );
    assert.deepEqual(linkedOwner.rows, [
      {
        id: LINK_OWNER_ACCESS_ID,
        member_id: LINK_FIRST_MEMBER_ID,
        role: 'owner',
        status: 'active',
      },
    ]);
    assert.deepEqual(
      await acceptOwner.handle({ token: firstInvitation.value.rawToken }, ownerContext),
      {
        success: false,
        error: {
          code: AcceptMemberAccessInvitationErrorCodes.InvitationAlreadyConsumed,
        },
      },
    );

    const inviteSecond = new InviteMemberToAccessHandler({
      clock,
      invitationIdGenerator: {
        generate: () => value(MemberAccessInvitationId.create(LINK_SECOND_INVITATION_ID)),
      },
      tokenDigester: tokenService,
      tokenGenerator: { generate: () => 'raw-integration-token-second' },
      unitOfWork: invitationUnitOfWork,
    });
    const secondInvitation = await inviteSecond.handle(
      { organizationId: LINK_ORGANIZATION_ID, memberId: LINK_SECOND_MEMBER_ID },
      ownerContext,
    );
    assert.equal(secondInvitation.success, true);
    if (!secondInvitation.success) return;

    const failingUnitOfWork: UnitOfWork<MemberAccessInvitationWriteScope> = {
      execute: (work) =>
        invitationUnitOfWork.execute((transactionalScope) =>
          work({
            ...transactionalScope,
            invitations: {
              add: transactionalScope.invitations.add.bind(transactionalScope.invitations),
              findById: transactionalScope.invitations.findById.bind(
                transactionalScope.invitations,
              ),
              async save() {
                throw new Error('simulated transactional failure');
              },
            },
          }),
        ),
    };
    const failingAccept = new AcceptMemberAccessInvitationHandler({
      clock,
      organizationAccessIdGenerator: {
        generate: () => value(OrganizationAccessId.create(LINK_MEMBER_ACCESS_ID)),
      },
      tokenDigester: tokenService,
      unitOfWork: failingUnitOfWork,
    });
    await assert.rejects(
      failingAccept.handle({ token: secondInvitation.value.rawToken }, memberContext),
      /simulated transactional failure/,
    );
    assert.equal(
      (
        await pool.query(
          `SELECT 1 FROM organization_accesses WHERE organization_id = $1 AND user_id = $2`,
          [LINK_ORGANIZATION_ID, LINK_MEMBER_USER_ID],
        )
      ).rowCount,
      0,
    );
    assert.equal(
      (
        await pool.query<{ status: string }>(
          'SELECT status FROM member_access_invitations WHERE id = $1',
          [LINK_SECOND_INVITATION_ID],
        )
      ).rows[0]?.status,
      'pending',
    );

    const acceptMember = new AcceptMemberAccessInvitationHandler({
      clock,
      organizationAccessIdGenerator: {
        generate: () => value(OrganizationAccessId.create(LINK_MEMBER_ACCESS_ID)),
      },
      tokenDigester: tokenService,
      unitOfWork: invitationUnitOfWork,
    });
    const concurrent = await Promise.all([
      acceptMember.handle({ token: secondInvitation.value.rawToken }, memberContext),
      acceptMember.handle({ token: secondInvitation.value.rawToken }, memberContext),
    ]);
    assert.equal(concurrent.filter((result) => result.success).length, 1);
    assert.equal(concurrent.filter((result) => !result.success).length, 1);
    assert.equal(
      (
        await pool.query(
          `SELECT 1 FROM organization_accesses
            WHERE organization_id = $1 AND user_id = $2 AND member_id = $3`,
          [LINK_ORGANIZATION_ID, LINK_MEMBER_USER_ID, LINK_SECOND_MEMBER_ID],
        )
      ).rowCount,
      1,
    );

    await assert.rejects(
      pool.query(
        `INSERT INTO organization_accesses (id, organization_id, user_id, role, status)
         VALUES ($1, $2, $3, 'owner', 'active')`,
        [LINK_CONFLICT_ACCESS_ID, LINK_ORGANIZATION_ID, LINK_OWNER_USER_ID],
      ),
      (error: unknown) =>
        (error as { constraint?: string }).constraint === 'organization_accesses_current_user_key',
    );
    await assert.rejects(
      pool.query(
        `INSERT INTO organization_accesses (
           id, organization_id, user_id, member_id, role, status
         ) VALUES ($1, $2, $3, $4, 'owner', 'active')`,
        [LINK_CONFLICT_ACCESS_ID, LINK_ORGANIZATION_ID, LINK_THIRD_USER_ID, LINK_FIRST_MEMBER_ID],
      ),
      (error: unknown) =>
        (error as { constraint?: string }).constraint ===
        'organization_accesses_current_member_key',
    );
    await assert.rejects(
      pool.query(
        `INSERT INTO member_access_invitations (
           id, organization_id, member_id, token_digest, expires_at, status
         ) VALUES ($1, $2, $3, $4, $5, 'pending')`,
        [
          LINK_CROSS_TENANT_INVITATION_ID,
          LINK_ORGANIZATION_ID,
          LINK_OTHER_MEMBER_ID,
          'f'.repeat(64),
          '2026-08-27T12:00:00.000Z',
        ],
      ),
      (error: unknown) =>
        (error as { constraint?: string }).constraint ===
        'member_access_invitations_member_tenant_fk',
    );
  });
});
