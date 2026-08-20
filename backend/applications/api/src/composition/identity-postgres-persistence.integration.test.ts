import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createExternalIdentityAssertion,
  parseIdentityIssuer,
  parseIdentitySubject,
} from '@/shared/application/authentication';
import { ExternalIdentity, User, UserId } from '@/modules/identity/domain';
import { OrganizationId } from '@/modules/organizations/domain';
import { requireTestDatabaseUrl } from '@/test-support/postgres-integration';
import { Pool } from 'pg';

import { createPostgresPersistence } from './persistence/create-postgres-persistence';
import {
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
