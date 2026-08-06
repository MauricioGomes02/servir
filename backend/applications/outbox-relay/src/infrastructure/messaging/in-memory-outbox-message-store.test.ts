import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createLeaseId,
  OutboxLeaseError,
  OutboxLeaseErrorCodes,
} from '@/application';
import {
  InMemoryOutboxMessageStore,
} from '.';

const MESSAGE = {
  messageId: 'message-1',
  eventId: 'event-1',
  correlationId: 'correlation-1',
  availableAt: '2026-07-29T15:00:00.000Z',
  event: {
    channel: 'servir.organizations.events',
    source: 'urn:servir:organizations',
    type: 'servir.organizations.organization.created.v1',
    name: 'organization.created',
    version: 1,
    occurredAt: '2026-07-29T14:59:00.000Z',
    payload: { organizationId: 'organization-1' },
    metadata: {},
  },
} as const;

const LEASE_IDS = [
  createLeaseId('0198f334-6dc5-7c20-9af1-91d7e599c001'),
  createLeaseId('0198f334-6dc5-7c20-9af1-91d7e599c002'),
  createLeaseId('0198f334-6dc5-7c20-9af1-91d7e599c003'),
] as const;

describe('InMemoryOutboxMessageStore', () => {
  it('rejects a transition at the exact lease expiration boundary', async () => {
    const store = new InMemoryOutboxMessageStore([MESSAGE]);
    await store.claim({
      leaseId: LEASE_IDS[0],
      claimedAt: '2026-07-29T15:00:00.000Z',
      leaseExpiresAt: '2026-07-29T15:01:00.000Z',
      limit: 1,
    });

    await assert.rejects(
      store.markPublished({
        messageId: 'message-1',
        leaseId: LEASE_IDS[0],
        publishedAt: '2026-07-29T15:01:00.000Z',
      }),
      (error: unknown) => error instanceof OutboxLeaseError
        && error.code === OutboxLeaseErrorCodes.Expired,
    );
  });

  it('allows only one active lease and recovers the message after expiration', async () => {
    const store = new InMemoryOutboxMessageStore([MESSAGE]);
    const firstClaim = await store.claim({
      leaseId: LEASE_IDS[0],
      claimedAt: '2026-07-29T15:00:00.000Z',
      leaseExpiresAt: '2026-07-29T15:01:00.000Z',
      limit: 1,
    });
    const concurrentClaim = await store.claim({
      leaseId: LEASE_IDS[1],
      claimedAt: '2026-07-29T15:00:30.000Z',
      leaseExpiresAt: '2026-07-29T15:01:30.000Z',
      limit: 1,
    });
    const recoveryClaim = await store.claim({
      leaseId: LEASE_IDS[2],
      claimedAt: '2026-07-29T15:01:00.000Z',
      leaseExpiresAt: '2026-07-29T15:02:00.000Z',
      limit: 1,
    });

    assert.equal(firstClaim.length, 1);
    assert.equal(concurrentClaim.length, 0);
    assert.equal(recoveryClaim.length, 1);
    assert.equal(recoveryClaim[0]?.leaseId, LEASE_IDS[2]);
    assert.equal(recoveryClaim[0]?.attemptCount, 2);
  });

  it('rejects a transition from a worker that no longer owns the lease', async () => {
    const store = new InMemoryOutboxMessageStore([MESSAGE]);
    await store.claim({
      leaseId: LEASE_IDS[0],
      claimedAt: '2026-07-29T15:00:00.000Z',
      leaseExpiresAt: '2026-07-29T15:01:00.000Z',
      limit: 1,
    });
    await store.claim({
      leaseId: LEASE_IDS[1],
      claimedAt: '2026-07-29T15:01:00.000Z',
      leaseExpiresAt: '2026-07-29T15:02:00.000Z',
      limit: 1,
    });

    await assert.rejects(
      store.markPublished({
        messageId: 'message-1',
        leaseId: LEASE_IDS[0],
        publishedAt: '2026-07-29T15:01:01.000Z',
      }),
      (error: unknown) => error instanceof OutboxLeaseError
        && error.code === OutboxLeaseErrorCodes.NotOwned,
    );
    assert.equal(store.currentMessages[0]?.publishedAt, undefined);
  });
});
