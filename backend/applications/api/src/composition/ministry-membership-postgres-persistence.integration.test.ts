import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ApproveMinistryMembershipHandler,
  RequestMinistryMembershipHandler,
} from '@/modules/ministries/application';
import { MinistryMembershipId, MinistryMembershipRequestPolicy } from '@/modules/ministries/domain';
import { createExecutionContext, parseCorrelationId } from '@/shared/application/context';
import { parseMessageId } from '@/shared/application/messaging';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';
import { FixedClock } from '@/shared/infrastructure/clock';
import { SequenceIdGenerator } from '@/shared/infrastructure/id-generator';
import { InMemoryLogger } from '@/shared/infrastructure/logging';
import { PostgresEventOutboxError } from '@/shared/infrastructure/messaging';
import { Pool } from 'pg';
import { requireTestDatabaseUrl } from '@/test-support/postgres-integration';
import { createPostgresPersistence } from './persistence/create-postgres-persistence';
import { ministryMembershipUnitOfWork } from './persistence/ministries-persistence-module';

const databaseUrl = requireTestDatabaseUrl();
const ids = {
  organization: '0198f334-6dc5-7c20-9af1-91d7e599f200',
  ministry: '0198f334-6dc5-7c20-9af1-91d7e599f201',
  member: '0198f334-6dc5-7c20-9af1-91d7e599f202',
  secondMember: '0198f334-6dc5-7c20-9af1-91d7e599f203',
  membership: '0198f334-6dc5-7c20-9af1-91d7e599f204',
  rolledBackMembership: '0198f334-6dc5-7c20-9af1-91d7e599f205',
  event: '0198f334-6dc5-7c20-9af1-91d7e599f206',
  rolledBackEvent: '0198f334-6dc5-7c20-9af1-91d7e599f207',
  message: '0198f334-6dc5-7c20-9af1-91d7e599f208',
  approvalEvent: '0198f334-6dc5-7c20-9af1-91d7e599f209',
  approvalMessage: '0198f334-6dc5-7c20-9af1-91d7e599f20a',
} as const;
function value<T>(result: { success: true; value: T } | { success: false }): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('Invalid deterministic integration fixture');
  return result.value;
}

describe('PostgreSQL ministry membership persistence', () => {
  it('adds and updates a tracked membership atomically and rolls back on failure', async (testContext) => {
    const inspection = new Pool({ connectionString: databaseUrl });
    const persistence = createPostgresPersistence(databaseUrl);
    async function cleanup() {
      await inspection.query('DELETE FROM outbox_messages WHERE message_id = ANY($1::uuid[])', [
        [ids.message, ids.approvalMessage],
      ]);
      await inspection.query('DELETE FROM ministry_memberships WHERE id = ANY($1::uuid[])', [
        [ids.membership, ids.rolledBackMembership],
      ]);
      await inspection.query('DELETE FROM members WHERE id = ANY($1::uuid[])', [
        [ids.member, ids.secondMember],
      ]);
      await inspection.query('DELETE FROM ministries WHERE id = $1', [ids.ministry]);
      await inspection.query('DELETE FROM organizations WHERE id = $1', [ids.organization]);
    }
    await cleanup();
    await inspection.query('INSERT INTO organizations (id, name) VALUES ($1, $2)', [
      ids.organization,
      'Membership integration organization',
    ]);
    await inspection.query(
      'INSERT INTO ministries (id, organization_id, name, status) VALUES ($1, $2, $3, 1)',
      [ids.ministry, ids.organization, 'Louvor'],
    );
    await inspection.query(
      'INSERT INTO members (id, organization_id, name, status, registered_at) VALUES ($1, $2, $3, 1, $4), ($5, $2, $6, 1, $4)',
      [ids.member, ids.organization, 'Maria', '2026-08-07T12:00:00.000Z', ids.secondMember, 'João'],
    );
    testContext.after(async () => {
      await cleanup();
      await persistence.close();
      await inspection.end();
    });
    const common = {
      clock: new FixedClock(value(Instant.create('2026-08-07T12:00:00.000Z'))),
      messageIdGenerator: new SequenceIdGenerator([value(parseMessageId(ids.message))]),
      policy: new MinistryMembershipRequestPolicy(),
      unitOfWork: persistence.services.get(ministryMembershipUnitOfWork),
      logger: new InMemoryLogger(),
    };
    const context = createExecutionContext({
      correlationId: value(parseCorrelationId('membership-integration')),
    });
    const committed = new RequestMinistryMembershipHandler({
      ...common,
      ministryMembershipIdGenerator: new SequenceIdGenerator([
        value(MinistryMembershipId.create(ids.membership)),
      ]),
      domainEventIdGenerator: new SequenceIdGenerator([value(parseDomainEventId(ids.event))]),
    });
    const result = await committed.handle(
      { organizationId: ids.organization, ministryId: ids.ministry, memberId: ids.member },
      context,
    );
    assert.equal(result.success, true);
    const row = await inspection.query(
      `SELECT mm.status, om.event_name, om.event_type, om.aggregate_id, om.partition_key
      FROM ministry_memberships mm JOIN outbox_messages om ON om.payload->>'ministryMembershipId' = mm.id::text WHERE mm.id = $1`,
      [ids.membership],
    );
    assert.equal(row.rowCount, 1);
    assert.equal(row.rows[0]?.status, 1);
    assert.equal(row.rows[0]?.event_name, 'ministry_membership.requested');
    assert.equal(row.rows[0]?.event_type, 'servir.ministries.ministry-membership.requested.v1');
    assert.equal(row.rows[0]?.aggregate_id, ids.membership);
    assert.equal(row.rows[0]?.partition_key, ids.organization);
    const approved = await new ApproveMinistryMembershipHandler({
      clock: new FixedClock(value(Instant.create('2026-08-07T13:00:00.000Z'))),
      domainEventIdGenerator: new SequenceIdGenerator([
        value(parseDomainEventId(ids.approvalEvent)),
      ]),
      messageIdGenerator: new SequenceIdGenerator([value(parseMessageId(ids.approvalMessage))]),
      unitOfWork: persistence.services.get(ministryMembershipUnitOfWork),
      logger: new InMemoryLogger(),
    }).handle(
      {
        organizationId: ids.organization,
        ministryId: ids.ministry,
        ministryMembershipId: ids.membership,
      },
      context,
    );
    assert.equal(approved.success, true);
    const approvedRow = await inspection.query<{ approved_at: Date; status: number }>(
      'SELECT approved_at, status FROM ministry_memberships WHERE id = $1',
      [ids.membership],
    );
    assert.equal(approvedRow.rows[0]?.status, 2);
    assert.equal(approvedRow.rows[0]?.approved_at.toISOString(), '2026-08-07T13:00:00.000Z');
    const failing = new RequestMinistryMembershipHandler({
      ...common,
      messageIdGenerator: new SequenceIdGenerator([value(parseMessageId(ids.message))]),
      ministryMembershipIdGenerator: new SequenceIdGenerator([
        value(MinistryMembershipId.create(ids.rolledBackMembership)),
      ]),
      domainEventIdGenerator: new SequenceIdGenerator([
        value(parseDomainEventId(ids.rolledBackEvent)),
      ]),
    });
    await assert.rejects(
      failing.handle(
        {
          organizationId: ids.organization,
          ministryId: ids.ministry,
          memberId: ids.secondMember,
        },
        context,
      ),
      (error: unknown) => error instanceof PostgresEventOutboxError,
    );
    assert.equal(
      (
        await inspection.query('SELECT 1 FROM ministry_memberships WHERE id = $1', [
          ids.rolledBackMembership,
        ])
      ).rowCount,
      0,
    );
  });
});
