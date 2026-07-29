import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Clock, RetryPolicy } from '@/application/ports';
import {
  ProcessOutboxBatchConfigError,
  ProcessOutboxBatchConfigErrorCodes,
} from '@/application/errors';
import {
  InMemoryIntegrationEventPublisher,
  InMemoryOutboxMessageStore,
  OutboxLeaseError,
  OutboxLeaseErrorCodes,
} from '@/infrastructure';

import { ProcessOutboxBatch } from './process-outbox-batch';

const CLAIMED_AT = '2026-07-29T15:00:00.000Z';
const LEASE_EXPIRES_AT = '2026-07-29T15:01:00.000Z';
const RETRY_AT = '2026-07-29T15:05:00.000Z';

function message(messageId: string) {
  return {
    messageId,
    eventId: `${messageId}-event`,
    correlationId: 'correlation-123',
    availableAt: CLAIMED_AT,
    event: {
      name: 'organization.created',
      version: 1,
      occurredAt: CLAIMED_AT,
      aggregateId: 'organization-123',
      partitionKey: 'organization-123',
      payload: { organizationId: 'organization-123' },
      metadata: {},
    },
  } as const;
}

class SequenceClock implements Clock {
  constructor(
    private readonly instants: string[],
    private readonly futureInstant = LEASE_EXPIRES_AT,
  ) {}

  now(): string {
    const instant = this.instants.shift();

    if (instant === undefined) {
      throw new Error('relay_test.clock_exhausted');
    }

    return instant;
  }

  after(): string {
    return this.futureInstant;
  }
}

function retryPolicy(retry: boolean): RetryPolicy {
  return {
    decide: () => retry
      ? { retry: true, availableAt: RETRY_AT }
      : { retry: false },
  };
}

function processBatch(input: Readonly<{
  clock: Clock;
  store: InMemoryOutboxMessageStore;
  publisher: InMemoryIntegrationEventPublisher;
  retryPolicy: RetryPolicy;
}>) {
  return new ProcessOutboxBatch({
    clock: input.clock,
    leaseIdGenerator: { generate: () => 'lease-123' },
    messageStore: input.store,
    publisher: input.publisher,
    retryPolicy: input.retryPolicy,
    batchSize: 10,
    leaseDurationMilliseconds: 60_000,
  });
}

describe('ProcessOutboxBatch', () => {
  it('rejects every non-positive or fractional processing limit', () => {
    const store = new InMemoryOutboxMessageStore([]);
    const publisher = new InMemoryIntegrationEventPublisher();

    for (const batchSize of [0, -1, 1.5]) {
      assert.throws(
        () => new ProcessOutboxBatch({
          clock: new SequenceClock([CLAIMED_AT]),
          leaseIdGenerator: { generate: () => 'lease-123' },
          messageStore: store,
          publisher,
          retryPolicy: retryPolicy(true),
          batchSize,
          leaseDurationMilliseconds: 60_000,
        }),
        (error: unknown) => error instanceof ProcessOutboxBatchConfigError
          && error.code === ProcessOutboxBatchConfigErrorCodes.InvalidBatchSize,
      );
    }
  });

  it('rejects every non-positive or fractional lease duration', () => {
    const store = new InMemoryOutboxMessageStore([]);
    const publisher = new InMemoryIntegrationEventPublisher();

    for (const leaseDurationMilliseconds of [0, -1, 1.5]) {
      assert.throws(
        () => new ProcessOutboxBatch({
          clock: new SequenceClock([CLAIMED_AT]),
          leaseIdGenerator: { generate: () => 'lease-123' },
          messageStore: store,
          publisher,
          retryPolicy: retryPolicy(true),
          batchSize: 10,
          leaseDurationMilliseconds,
        }),
        (error: unknown) => error instanceof ProcessOutboxBatchConfigError
          && error.code
            === ProcessOutboxBatchConfigErrorCodes.InvalidLeaseDuration,
      );
    }
  });

  it('publishes claimed messages and reschedules a transient failure', async () => {
    const store = new InMemoryOutboxMessageStore([
      message('message-1'),
      message('message-2'),
    ]);
    const publisher = new InMemoryIntegrationEventPublisher({
      'message-2': 'kafka.unavailable',
    });
    const worker = processBatch({
      clock: new SequenceClock([
        CLAIMED_AT,
        '2026-07-29T15:00:01.000Z',
        '2026-07-29T15:00:02.000Z',
      ]),
      store,
      publisher,
      retryPolicy: retryPolicy(true),
    });

    const result = await worker.execute();

    assert.deepEqual(result, {
      claimed: 2,
      published: 1,
      rescheduled: 1,
      failed: 0,
    });
    assert.deepEqual(
      publisher.messages.map((published) => published.messageId),
      ['message-1'],
    );
    assert.equal(store.currentMessages[0]?.publishedAt,
      '2026-07-29T15:00:01.000Z');
    assert.equal(store.currentMessages[1]?.availableAt, RETRY_AT);
    assert.equal(store.currentMessages[1]?.lastErrorCode, 'kafka.unavailable');
  });

  it('marks a publication failure as terminal when retry is denied', async () => {
    const store = new InMemoryOutboxMessageStore([message('message-1')]);
    const publisher = new InMemoryIntegrationEventPublisher({
      'message-1': 'kafka.message_rejected',
    });
    const worker = processBatch({
      clock: new SequenceClock([
        CLAIMED_AT,
        '2026-07-29T15:00:01.000Z',
      ]),
      store,
      publisher,
      retryPolicy: retryPolicy(false),
    });

    const result = await worker.execute();

    assert.deepEqual(result, {
      claimed: 1,
      published: 0,
      rescheduled: 0,
      failed: 1,
    });
    assert.equal(store.currentMessages[0]?.failedAt,
      '2026-07-29T15:00:01.000Z');
  });

  it('propagates an expired confirmation after the broker accepted the message', async () => {
    const store = new InMemoryOutboxMessageStore([message('message-1')]);
    const publisher = new InMemoryIntegrationEventPublisher();
    const worker = processBatch({
      clock: new SequenceClock(
        [CLAIMED_AT, '2026-07-29T15:00:02.000Z'],
        '2026-07-29T15:00:01.000Z',
      ),
      store,
      publisher,
      retryPolicy: retryPolicy(true),
    });

    await assert.rejects(
      worker.execute(),
      (error: unknown) => error instanceof OutboxLeaseError
        && error.code === OutboxLeaseErrorCodes.Expired,
    );
    assert.equal(publisher.messages.length, 1);
    assert.equal(store.currentMessages[0]?.publishedAt, undefined);
  });
});
