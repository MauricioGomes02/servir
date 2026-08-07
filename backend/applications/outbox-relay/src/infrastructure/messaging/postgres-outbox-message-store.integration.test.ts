import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Pool } from 'pg';

import { createLeaseId, OutboxLeaseError, OutboxLeaseErrorCodes } from '@/application';

import { PostgresOutboxMessageStore } from './postgres-outbox-message-store';

const databaseUrl = process.env.TEST_DATABASE_URL;
const integrationIt = databaseUrl === undefined ? it.skip : it;

const CLAIMED_AT = '2026-07-29T15:00:00.000Z';
const FIRST_EXPIRATION = '2026-07-29T15:01:00.000Z';
const SECOND_EXPIRATION = '2026-07-29T15:02:00.000Z';

const MESSAGE_IDS = [
  '0198f334-6dc5-7c20-9af1-91d7e599a001',
  '0198f334-6dc5-7c20-9af1-91d7e599a002',
  '0198f334-6dc5-7c20-9af1-91d7e599a003',
  '0198f334-6dc5-7c20-9af1-91d7e599a004',
  '0198f334-6dc5-7c20-9af1-91d7e599a005',
  '0198f334-6dc5-7c20-9af1-91d7e599a006',
] as const;

const EVENT_IDS = [
  '0198f334-6dc5-7c20-9af1-91d7e599b001',
  '0198f334-6dc5-7c20-9af1-91d7e599b002',
  '0198f334-6dc5-7c20-9af1-91d7e599b003',
  '0198f334-6dc5-7c20-9af1-91d7e599b004',
  '0198f334-6dc5-7c20-9af1-91d7e599b005',
  '0198f334-6dc5-7c20-9af1-91d7e599b006',
] as const;

const LEASE_IDS = [
  createLeaseId('0198f334-6dc5-7c20-9af1-91d7e599c001'),
  createLeaseId('0198f334-6dc5-7c20-9af1-91d7e599c002'),
  createLeaseId('0198f334-6dc5-7c20-9af1-91d7e599c003'),
] as const;

async function insertMessage(pool: Pool, index: number, availableAt = CLAIMED_AT): Promise<void> {
  await pool.query(
    `INSERT INTO outbox_messages (
       message_id,
       event_id,
       event_name,
       publication_channel,
       event_source,
       event_type,
       event_version,
       occurred_at,
       aggregate_id,
       partition_key,
       correlation_id,
       payload,
       metadata,
       available_at
     ) VALUES (
       $1::uuid,
       $2::uuid,
       'organization.created',
       'servir.organizations.events',
       'urn:servir:organizations',
       'servir.organizations.organization.created.v1',
       1,
       $3::timestamptz,
       $1::uuid,
       $1,
       'relay-integration-test',
       jsonb_build_object('organizationId', $1),
       '{}'::jsonb,
       $4::timestamptz
     )`,
    [MESSAGE_IDS[index], EVENT_IDS[index], CLAIMED_AT, availableAt],
  );
}

describe('PostgresOutboxMessageStore', () => {
  integrationIt(
    'claims available messages once across concurrent workers and respects the batch limit',
    async (testContext) => {
      assert.notEqual(databaseUrl, undefined);

      if (databaseUrl === undefined) {
        return;
      }

      const pool = new Pool({ connectionString: databaseUrl });
      const store = new PostgresOutboxMessageStore(pool);
      const cleanup = async () =>
        pool.query('DELETE FROM outbox_messages WHERE message_id = ANY($1::uuid[])', [
          [MESSAGE_IDS[0], MESSAGE_IDS[1], MESSAGE_IDS[2]],
        ]);
      await cleanup();
      testContext.after(async () => {
        await cleanup();
        await pool.end();
      });
      await insertMessage(pool, 0);
      await insertMessage(pool, 1);
      await insertMessage(pool, 2, '2026-07-29T16:00:00.000Z');

      const [first, second] = await Promise.all([
        store.claim({
          leaseId: LEASE_IDS[0],
          claimedAt: CLAIMED_AT,
          leaseExpiresAt: FIRST_EXPIRATION,
          limit: 1,
        }),
        store.claim({
          leaseId: LEASE_IDS[1],
          claimedAt: CLAIMED_AT,
          leaseExpiresAt: FIRST_EXPIRATION,
          limit: 1,
        }),
      ]);
      const claimed = [...first, ...second];

      assert.equal(claimed.length, 2);
      assert.equal(new Set(claimed.map((message) => message.messageId)).size, 2);
      assert.equal(
        claimed.some((message) => message.messageId === MESSAGE_IDS[2]),
        false,
      );
      assert.deepEqual(
        claimed.map((message) => message.attemptCount),
        [1, 1],
      );
    },
  );

  integrationIt(
    'rejects the expiration boundary and recovers the message with a new lease',
    async (testContext) => {
      assert.notEqual(databaseUrl, undefined);

      if (databaseUrl === undefined) {
        return;
      }

      const pool = new Pool({ connectionString: databaseUrl });
      const store = new PostgresOutboxMessageStore(pool);
      const cleanup = async () =>
        pool.query('DELETE FROM outbox_messages WHERE message_id = $1::uuid', [MESSAGE_IDS[3]]);
      await cleanup();
      testContext.after(async () => {
        await cleanup();
        await pool.end();
      });
      await insertMessage(pool, 3);
      await store.claim({
        leaseId: LEASE_IDS[0],
        claimedAt: CLAIMED_AT,
        leaseExpiresAt: FIRST_EXPIRATION,
        limit: 1,
      });

      await assert.rejects(
        store.markPublished({
          messageId: MESSAGE_IDS[3],
          leaseId: LEASE_IDS[0],
          publishedAt: FIRST_EXPIRATION,
        }),
        (error: unknown) =>
          error instanceof OutboxLeaseError && error.code === OutboxLeaseErrorCodes.Expired,
      );

      const recovered = await store.claim({
        leaseId: LEASE_IDS[1],
        claimedAt: FIRST_EXPIRATION,
        leaseExpiresAt: SECOND_EXPIRATION,
        limit: 1,
      });

      assert.equal(recovered[0]?.messageId, MESSAGE_IDS[3]);
      assert.equal(recovered[0]?.attemptCount, 2);

      await assert.rejects(
        store.markPublished({
          messageId: MESSAGE_IDS[3],
          leaseId: LEASE_IDS[0],
          publishedAt: '2026-07-29T15:01:01.000Z',
        }),
        (error: unknown) =>
          error instanceof OutboxLeaseError && error.code === OutboxLeaseErrorCodes.NotOwned,
      );
    },
  );

  integrationIt(
    'persists publication, rescheduling, and terminal failure only for the owned lease',
    async (testContext) => {
      assert.notEqual(databaseUrl, undefined);

      if (databaseUrl === undefined) {
        return;
      }

      const pool = new Pool({ connectionString: databaseUrl });
      const store = new PostgresOutboxMessageStore(pool);
      const transitionIds = [MESSAGE_IDS[3], MESSAGE_IDS[4], MESSAGE_IDS[5]];
      const cleanup = async () =>
        pool.query('DELETE FROM outbox_messages WHERE message_id = ANY($1::uuid[])', [
          transitionIds,
        ]);
      await cleanup();
      testContext.after(async () => {
        await cleanup();
        await pool.end();
      });
      await insertMessage(pool, 3);
      await insertMessage(pool, 4);
      await insertMessage(pool, 5);
      const claimed = await store.claim({
        leaseId: LEASE_IDS[2],
        claimedAt: CLAIMED_AT,
        leaseExpiresAt: SECOND_EXPIRATION,
        limit: 3,
      });

      assert.equal(claimed.length, 3);
      await store.markPublished({
        messageId: MESSAGE_IDS[3],
        leaseId: LEASE_IDS[2],
        publishedAt: '2026-07-29T15:00:10.000Z',
      });
      await store.reschedule({
        messageId: MESSAGE_IDS[4],
        leaseId: LEASE_IDS[2],
        failedAt: '2026-07-29T15:00:11.000Z',
        availableAt: '2026-07-29T15:05:00.000Z',
        errorCode: 'kafka.unavailable',
      });
      await store.markFailed({
        messageId: MESSAGE_IDS[5],
        leaseId: LEASE_IDS[2],
        failedAt: '2026-07-29T15:00:12.000Z',
        errorCode: 'kafka.message_rejected',
      });

      const states = await pool.query(
        `SELECT message_id,
              available_at,
              lease_id,
              published_at,
              failed_at,
              last_error_code
       FROM outbox_messages
       WHERE message_id = ANY($1::uuid[])
       ORDER BY message_id`,
        [transitionIds],
      );

      assert.equal(states.rows[0]?.published_at.toISOString(), '2026-07-29T15:00:10.000Z');
      assert.equal(states.rows[0]?.lease_id, null);
      assert.equal(states.rows[1]?.available_at.toISOString(), '2026-07-29T15:05:00.000Z');
      assert.equal(states.rows[1]?.last_error_code, 'kafka.unavailable');
      assert.equal(states.rows[1]?.lease_id, null);
      assert.equal(states.rows[2]?.failed_at.toISOString(), '2026-07-29T15:00:12.000Z');
      assert.equal(states.rows[2]?.last_error_code, 'kafka.message_rejected');
      assert.equal(states.rows[2]?.lease_id, null);
    },
  );
});
