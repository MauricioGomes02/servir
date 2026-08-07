import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CreateOrganizationHandler } from '@/modules/organizations/application';
import { OrganizationId } from '@/modules/organizations/domain';
import { createExecutionContext, parseCorrelationId } from '@/shared/application/context';
import { parseMessageId, type MessageId } from '@/shared/application/messaging';
import { parseDomainEventId, type DomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';
import { FixedClock } from '@/shared/infrastructure/clock';
import { SequenceIdGenerator } from '@/shared/infrastructure/id-generator';
import { InMemoryLogger } from '@/shared/infrastructure/logging';
import {
  PostgresEventOutboxError,
  PostgresEventOutboxErrorCode,
} from '@/shared/infrastructure/messaging';
import { Pool } from 'pg';

import { createPostgresPersistence } from './create-postgres-persistence';

const databaseUrl = process.env.TEST_DATABASE_URL;
const integrationIt = databaseUrl === undefined ? it.skip : it;

const ORGANIZATION_ID = '0198f334-6dc5-7c20-9af1-91d7e599d001';
const ROLLED_BACK_ORGANIZATION_ID = '0198f334-6dc5-7c20-9af1-91d7e599d002';
const EVENT_ID = '0198f334-6dc5-7c20-9af1-91d7e599d003';
const ROLLED_BACK_EVENT_ID = '0198f334-6dc5-7c20-9af1-91d7e599d004';
const MESSAGE_ID = '0198f334-6dc5-7c20-9af1-91d7e599d005';

function requireValue<TValue>(
  result: Readonly<{ success: true; value: TValue } | { success: false }>,
): TValue {
  assert.equal(result.success, true);

  if (!result.success) {
    throw new Error('Invalid deterministic integration fixture');
  }

  return result.value;
}

describe('PostgreSQL organization persistence', () => {
  integrationIt(
    'commits organization and outbox atomically and rolls both back on failure',
    async (testContext) => {
      assert.notEqual(databaseUrl, undefined);

      if (databaseUrl === undefined) {
        return;
      }

      const inspectionPool = new Pool({ connectionString: databaseUrl });
      const persistence = createPostgresPersistence(databaseUrl);
      const correlationId = requireValue(parseCorrelationId('integration-test'));
      const occurredAt = requireValue(Instant.create('2026-07-29T15:00:00.000Z'));
      const organizationId = requireValue(OrganizationId.create(ORGANIZATION_ID));
      const rolledBackOrganizationId = requireValue(
        OrganizationId.create(ROLLED_BACK_ORGANIZATION_ID),
      );
      const eventId = requireValue(parseDomainEventId(EVENT_ID));
      const rolledBackEventId = requireValue(parseDomainEventId(ROLLED_BACK_EVENT_ID));
      const messageId = requireValue(parseMessageId(MESSAGE_ID));

      async function cleanup(): Promise<void> {
        await inspectionPool.query('DELETE FROM outbox_messages WHERE message_id = $1', [
          MESSAGE_ID,
        ]);
        await inspectionPool.query('DELETE FROM organizations WHERE id = ANY($1::uuid[])', [
          [ORGANIZATION_ID, ROLLED_BACK_ORGANIZATION_ID],
        ]);
      }

      await cleanup();
      testContext.after(async () => {
        await cleanup();
        await persistence.close();
        await inspectionPool.end();
      });

      const context = createExecutionContext({ correlationId });
      const committedHandler = new CreateOrganizationHandler({
        clock: new FixedClock(occurredAt),
        organizationIdGenerator: new SequenceIdGenerator([organizationId]),
        domainEventIdGenerator: new SequenceIdGenerator<DomainEventId>([eventId]),
        messageIdGenerator: new SequenceIdGenerator<MessageId>([messageId]),
        unitOfWork: persistence.organizationUnitOfWork,
        logger: new InMemoryLogger(),
      });

      await committedHandler.handle({ name: 'Committed organization' }, context);

      const committed = await inspectionPool.query(
        `SELECT o.name,
              m.event_name,
              m.publication_channel,
              m.event_source,
              m.event_type,
              m.event_version,
              m.aggregate_id,
              m.partition_key,
              m.metadata,
              m.payload
       FROM organizations o
       JOIN outbox_messages m
         ON m.payload->>'organizationId' = o.id::text
       WHERE o.id = $1`,
        [ORGANIZATION_ID],
      );

      assert.equal(committed.rowCount, 1);
      assert.equal(committed.rows[0]?.name, 'Committed organization');
      assert.equal(committed.rows[0]?.event_name, 'organization.created');
      assert.equal(committed.rows[0]?.publication_channel, 'servir.organizations.events');
      assert.equal(committed.rows[0]?.event_source, 'urn:servir:organizations');
      assert.equal(committed.rows[0]?.event_type, 'servir.organizations.organization.created.v1');
      assert.equal(committed.rows[0]?.event_version, 1);
      assert.equal(committed.rows[0]?.aggregate_id, ORGANIZATION_ID);
      assert.equal(committed.rows[0]?.partition_key, ORGANIZATION_ID);
      assert.deepEqual(committed.rows[0]?.metadata, {
        event: {},
        trace: {},
      });
      assert.deepEqual(committed.rows[0]?.payload, {
        organizationId: ORGANIZATION_ID,
        name: 'Committed organization',
      });

      const failingHandler = new CreateOrganizationHandler({
        clock: new FixedClock(occurredAt),
        organizationIdGenerator: new SequenceIdGenerator([rolledBackOrganizationId]),
        domainEventIdGenerator: new SequenceIdGenerator<DomainEventId>([rolledBackEventId]),
        messageIdGenerator: new SequenceIdGenerator<MessageId>([messageId]),
        unitOfWork: persistence.organizationUnitOfWork,
        logger: new InMemoryLogger(),
      });

      await assert.rejects(
        failingHandler.handle({ name: 'Rolled back organization' }, context),
        (error: unknown) =>
          error instanceof PostgresEventOutboxError && error.code === PostgresEventOutboxErrorCode,
      );

      const rolledBack = await inspectionPool.query('SELECT 1 FROM organizations WHERE id = $1', [
        ROLLED_BACK_ORGANIZATION_ID,
      ]);

      assert.equal(rolledBack.rowCount, 0);
    },
  );
});
