import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { OpenAvailabilityRequestHandler } from '@/modules/availability/application';
import {
  AvailabilityRequestId,
  AvailabilityRequestOpeningPolicy,
} from '@/modules/availability/domain';
import { createExecutionContext, parseCorrelationId } from '@/shared/application/context';
import { parseMessageId } from '@/shared/application/messaging';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';
import { FixedClock } from '@/shared/infrastructure/clock';
import { SequenceIdGenerator } from '@/shared/infrastructure/id-generator';
import { PostgresEventOutboxError } from '@/shared/infrastructure/messaging';
import { Pool } from 'pg';
import { requireTestDatabaseUrl } from '@/test-support/postgres-integration';
import { createPostgresPersistence } from './create-postgres-persistence';
import {
  availabilityRequestOpeningFacts,
  availabilityRequestUnitOfWork,
} from './modules/availability-persistence-module';

const databaseUrl = requireTestDatabaseUrl();
const ORGANIZATION_ID = '0198f334-6dc5-7c20-9af1-91d7e59d0001';
const MINISTRY_ID = '0198f334-6dc5-7c20-9af1-91d7e59d0002';
const TEAM_ID = '0198f334-6dc5-7c20-9af1-91d7e59d0003';
const REQUEST_ID = '0198f334-6dc5-7c20-9af1-91d7e59d0004';
const ROLLED_BACK_REQUEST_ID = '0198f334-6dc5-7c20-9af1-91d7e59d0005';
const MESSAGE_ID = '0198f334-6dc5-7c20-9af1-91d7e59d0006';

function value<T>(result: { success: true; value: T } | { success: false }): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('Invalid deterministic integration fixture');
  return result.value;
}

describe('PostgreSQL availability request persistence', () => {
  it('commits the request and outbox atomically', async (testContext) => {
    const inspection = new Pool({ connectionString: databaseUrl });
    const persistence = createPostgresPersistence(databaseUrl);
    async function cleanup() {
      await inspection.query('DELETE FROM outbox_messages WHERE message_id = $1', [MESSAGE_ID]);
      await inspection.query('DELETE FROM availability_requests WHERE id = ANY($1::uuid[])', [
        [REQUEST_ID, ROLLED_BACK_REQUEST_ID],
      ]);
      await inspection.query('DELETE FROM ministry_teams WHERE id = $1', [TEAM_ID]);
      await inspection.query('DELETE FROM ministries WHERE id = $1', [MINISTRY_ID]);
      await inspection.query('DELETE FROM organizations WHERE id = $1', [ORGANIZATION_ID]);
    }
    await cleanup();
    await inspection.query('INSERT INTO organizations (id, name) VALUES ($1, $2)', [
      ORGANIZATION_ID,
      'Availability integration organization',
    ]);
    await inspection.query(
      'INSERT INTO ministries (id, organization_id, name, status) VALUES ($1, $2, $3, 1)',
      [MINISTRY_ID, ORGANIZATION_ID, 'Louvor'],
    );
    await inspection.query(
      'INSERT INTO ministry_teams (id, organization_id, ministry_id, name, status) VALUES ($1, $2, $3, $4, 1)',
      [TEAM_ID, ORGANIZATION_ID, MINISTRY_ID, 'Louvor A'],
    );
    testContext.after(async () => {
      await cleanup();
      await persistence.close();
      await inspection.end();
    });

    const common = {
      clock: new FixedClock(value(Instant.create('2026-08-11T12:00:00.000Z'))),
      facts: persistence.services.get(availabilityRequestOpeningFacts),
      policy: new AvailabilityRequestOpeningPolicy(),
      unitOfWork: persistence.services.get(availabilityRequestUnitOfWork),
    };
    const command = {
      organizationId: ORGANIZATION_ID,
      ministryTeamId: TEAM_ID,
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      respondBy: '2026-08-25T23:59:59.000Z',
    };
    const context = createExecutionContext({
      correlationId: value(parseCorrelationId('availability-postgres-integration')),
    });
    const committed = new OpenAvailabilityRequestHandler({
      ...common,
      availabilityRequestIdGenerator: new SequenceIdGenerator([
        value(AvailabilityRequestId.create(REQUEST_ID)),
      ]),
      domainEventIdGenerator: new SequenceIdGenerator([
        value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e59d0007')),
      ]),
      messageIdGenerator: new SequenceIdGenerator([value(parseMessageId(MESSAGE_ID))]),
    });
    assert.equal((await committed.handle(command, context)).success, true);
    const persisted = await inspection.query(
      `SELECT r.status, o.event_type FROM availability_requests r JOIN outbox_messages o ON o.aggregate_id = r.id WHERE r.id = $1`,
      [REQUEST_ID],
    );
    assert.equal(persisted.rowCount, 1);
    assert.equal(persisted.rows[0]?.status, 1);
    assert.equal(
      persisted.rows[0]?.event_type,
      'servir.availability.availability-request.opened.v1',
    );

    const failing = new OpenAvailabilityRequestHandler({
      ...common,
      availabilityRequestIdGenerator: new SequenceIdGenerator([
        value(AvailabilityRequestId.create(ROLLED_BACK_REQUEST_ID)),
      ]),
      domainEventIdGenerator: new SequenceIdGenerator([
        value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e59d0008')),
      ]),
      messageIdGenerator: new SequenceIdGenerator([value(parseMessageId(MESSAGE_ID))]),
    });
    await assert.rejects(
      failing.handle(command, context),
      (error: unknown) => error instanceof PostgresEventOutboxError,
    );
    assert.equal(
      (
        await inspection.query('SELECT 1 FROM availability_requests WHERE id = $1', [
          ROLLED_BACK_REQUEST_ID,
        ])
      ).rowCount,
      0,
    );
  });
});
