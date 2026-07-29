import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Pool } from 'pg';

import { PostgresOutboxMessageStore } from './postgres-outbox-message-store';
import {
  PostgresOutboxMessageStoreError,
  PostgresOutboxMessageStoreErrorCodes,
} from './postgres-outbox-message-store-error';

const CLAIM = {
  leaseId: '0198f334-6dc5-7c20-9af1-91d7e599c001',
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
      (error: unknown) => error instanceof PostgresOutboxMessageStoreError
        && error.code === PostgresOutboxMessageStoreErrorCodes.ClaimFailed
        && error.cause === cause,
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
      (error: unknown) => error instanceof PostgresOutboxMessageStoreError
        && error.code === PostgresOutboxMessageStoreErrorCodes.InvalidRow,
    );
  });
});
