import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CreateMinistryHandler } from '@/modules/ministries/application';
import { MinistryCreationPolicy, MinistryId } from '@/modules/ministries/domain';
import { OrganizationId } from '@/modules/organizations/domain';
import { createExecutionContext, parseCorrelationId } from '@/shared/application/context';
import { parseMessageId, type MessageId } from '@/shared/application/messaging';
import { parseDomainEventId, type DomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';
import { FixedClock } from '@/shared/infrastructure/clock';
import { SequenceIdGenerator } from '@/shared/infrastructure/id-generator';
import { InMemoryLogger } from '@/shared/infrastructure/logging';
import { PostgresEventOutboxError } from '@/shared/infrastructure/messaging';
import { Pool } from 'pg';
import { createPostgresPersistence } from './create-postgres-persistence';

const databaseUrl = process.env.TEST_DATABASE_URL;
const integrationIt = databaseUrl === undefined ? it.skip : it;
const ORGANIZATION_ID = '0198f334-6dc5-7c20-9af1-91d7e599f100';
const MINISTRY_ID = '0198f334-6dc5-7c20-9af1-91d7e599f101';
const ROLLED_BACK_MINISTRY_ID = '0198f334-6dc5-7c20-9af1-91d7e599f102';
const EVENT_ID = '0198f334-6dc5-7c20-9af1-91d7e599f103';
const ROLLED_BACK_EVENT_ID = '0198f334-6dc5-7c20-9af1-91d7e599f104';
const MESSAGE_ID = '0198f334-6dc5-7c20-9af1-91d7e599f105';

function value<T>(result: { success: true; value: T } | { success: false }): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('Invalid deterministic integration fixture');
  return result.value;
}

describe('PostgreSQL ministry persistence', () => {
  integrationIt(
    'commits ministry and outbox atomically and rolls both back on outbox failure',
    async (testContext) => {
      assert.notEqual(databaseUrl, undefined);
      if (databaseUrl === undefined) return;
      const inspection = new Pool({ connectionString: databaseUrl });
      const persistence = createPostgresPersistence(databaseUrl);

      async function cleanup() {
        await inspection.query('DELETE FROM outbox_messages WHERE message_id = $1', [MESSAGE_ID]);
        await inspection.query('DELETE FROM ministry_roles WHERE ministry_id = $1', [MINISTRY_ID]);
        await inspection.query('DELETE FROM ministries WHERE id = ANY($1::uuid[])', [
          [MINISTRY_ID, ROLLED_BACK_MINISTRY_ID],
        ]);
        await inspection.query('DELETE FROM organizations WHERE id = $1', [ORGANIZATION_ID]);
      }
      await cleanup();
      await inspection.query('INSERT INTO organizations (id, name) VALUES ($1, $2)', [
        ORGANIZATION_ID,
        'Ministry integration organization',
      ]);
      testContext.after(async () => {
        await cleanup();
        await persistence.close();
        await inspection.end();
      });

      const organizationId = value(OrganizationId.create(ORGANIZATION_ID));
      const context = createExecutionContext({
        correlationId: value(parseCorrelationId('ministry-integration')),
      });
      const common = {
        clock: new FixedClock(value(Instant.create('2026-08-06T15:00:00.000Z'))),
        creationFacts: persistence.ministryCreationFacts,
        creationPolicy: new MinistryCreationPolicy(),
        unitOfWork: persistence.ministryUnitOfWork,
        logger: new InMemoryLogger(),
      };
      const committed = new CreateMinistryHandler({
        ...common,
        ministryIdGenerator: new SequenceIdGenerator([value(MinistryId.create(MINISTRY_ID))]),
        domainEventIdGenerator: new SequenceIdGenerator<DomainEventId>([
          value(parseDomainEventId(EVENT_ID)),
        ]),
        messageIdGenerator: new SequenceIdGenerator<MessageId>([value(parseMessageId(MESSAGE_ID))]),
      });
      const result = await committed.handle(
        { organizationId: organizationId.toString(), name: 'Louvor' },
        context,
      );
      assert.equal(result.success, true);

      const row = await inspection.query(
        `SELECT mi.name, mi.status, m.event_name, m.publication_channel,
              m.event_type, m.aggregate_id, m.partition_key, m.payload
       FROM ministries mi
       JOIN outbox_messages m ON m.payload->>'ministryId' = mi.id::text
       WHERE mi.id = $1`,
        [MINISTRY_ID],
      );
      assert.equal(row.rowCount, 1);
      assert.equal(row.rows[0]?.name, 'Louvor');
      assert.equal(row.rows[0]?.status, 1);
      assert.equal(row.rows[0]?.event_name, 'ministry.created');
      assert.equal(row.rows[0]?.publication_channel, 'servir.ministries.events');
      assert.equal(row.rows[0]?.event_type, 'servir.ministries.ministry.created.v1');
      assert.equal(row.rows[0]?.aggregate_id, MINISTRY_ID);
      assert.equal(row.rows[0]?.partition_key, ORGANIZATION_ID);
      assert.deepEqual(row.rows[0]?.payload, {
        ministryId: MINISTRY_ID,
        organizationId: ORGANIZATION_ID,
        name: 'Louvor',
        status: 'active',
      });

      const failing = new CreateMinistryHandler({
        ...common,
        ministryIdGenerator: new SequenceIdGenerator([
          value(MinistryId.create(ROLLED_BACK_MINISTRY_ID)),
        ]),
        domainEventIdGenerator: new SequenceIdGenerator<DomainEventId>([
          value(parseDomainEventId(ROLLED_BACK_EVENT_ID)),
        ]),
        messageIdGenerator: new SequenceIdGenerator<MessageId>([value(parseMessageId(MESSAGE_ID))]),
      });
      await assert.rejects(
        failing.handle({ organizationId: organizationId.toString(), name: 'Mídia' }, context),
        (error: unknown) => error instanceof PostgresEventOutboxError,
      );
      assert.equal(
        (
          await inspection.query('SELECT 1 FROM ministries WHERE id = $1', [
            ROLLED_BACK_MINISTRY_ID,
          ])
        ).rowCount,
        0,
      );
    },
  );
});
