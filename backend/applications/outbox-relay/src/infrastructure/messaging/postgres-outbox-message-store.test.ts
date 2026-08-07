import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Pool } from 'pg';

import { createLeaseId } from '@/application';

import { PostgresOutboxMessageStore } from './postgres-outbox-message-store';
import {
  PostgresOutboxMessageStoreError,
  PostgresOutboxMessageStoreErrorCodes,
} from './postgres-outbox-message-store-error';

const CLAIM = {
  leaseId: createLeaseId('0198f334-6dc5-7c20-9af1-91d7e599c001'),
  claimedAt: '2026-07-29T15:00:00.000Z',
  leaseExpiresAt: '2026-07-29T15:01:00.000Z',
  limit: 10,
} as const;

describe('PostgresOutboxMessageStore failures', () => {
  it('classifies a claim query failure and preserves its cause', async () => {
    const cause = new Error('driver details must not define behavior');
    const pool = {
      async query() {
        throw cause;
      },
    } as unknown as Pool;
    const store = new PostgresOutboxMessageStore(pool);

    await assert.rejects(
      store.claim(CLAIM),
      (error: unknown) =>
        error instanceof PostgresOutboxMessageStoreError &&
        error.code === PostgresOutboxMessageStoreErrorCodes.ClaimFailed &&
        error.cause === cause,
    );
  });

  it('rejects a persisted row that violates the integration contract', async () => {
    const pool = {
      async query() {
        return { rows: [{ event_name: 'organization.created' }] };
      },
    } as unknown as Pool;
    const store = new PostgresOutboxMessageStore(pool);

    await assert.rejects(
      store.claim(CLAIM),
      (error: unknown) =>
        error instanceof PostgresOutboxMessageStoreError &&
        error.code === PostgresOutboxMessageStoreErrorCodes.InvalidRow,
    );
  });
});

describe('PostgresOutboxMessageStore metadata', () => {
  it('separates functional event metadata from persisted trace context', async () => {
    const pool = {
      async query() {
        return {
          rows: [
            {
              message_id: '0198f334-6dc5-7c20-9af1-91d7e599c010',
              event_id: '0198f334-6dc5-7c20-9af1-91d7e599c011',
              event_name: 'organization.created',
              publication_channel: 'servir.organizations.events',
              event_source: 'urn:servir:organizations',
              event_type: 'servir.organizations.organization.created.v1',
              event_version: 1,
              occurred_at: new Date('2026-07-29T15:00:00.000Z'),
              aggregate_id: '0198f334-6dc5-7c20-9af1-91d7e599c012',
              partition_key: '0198f334-6dc5-7c20-9af1-91d7e599c012',
              correlation_id: 'correlation-123',
              causation_id: null,
              payload: { organizationId: '0198f334-6dc5-7c20-9af1-91d7e599c012' },
              metadata: {
                event: { schema: 'public' },
                trace: {
                  traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
                  tracestate: 'vendor=value',
                },
              },
              attempt_count: 1,
              lease_id: CLAIM.leaseId,
              lease_expires_at: new Date(CLAIM.leaseExpiresAt),
            },
          ],
        };
      },
    } as unknown as Pool;

    const [claimed] = await new PostgresOutboxMessageStore(pool).claim(CLAIM);

    assert.equal(claimed?.event.channel, 'servir.organizations.events');
    assert.equal(claimed?.event.source, 'urn:servir:organizations');
    assert.equal(claimed?.event.type, 'servir.organizations.organization.created.v1');
    assert.deepEqual(claimed?.event.metadata, { schema: 'public' });
    assert.deepEqual(claimed?.traceContext, {
      traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
      tracestate: 'vendor=value',
    });
  });
});
