import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Clock, RelayTelemetry, RetryPolicy } from '@/application/ports';
import {
  IntegrationEventPublicationError,
  OutboxLeaseError,
  OutboxLeaseErrorCodes,
  ProcessOutboxBatchConfigError,
  ProcessOutboxBatchConfigErrorCodes,
} from '@/application/errors';
import { createLeaseId } from '@/application/lease-id';
import { InMemoryIntegrationEventPublisher, InMemoryOutboxMessageStore } from '@/infrastructure';

import { ProcessOutboxBatch } from './process-outbox-batch';

const CLAIMED_AT = '2026-07-29T15:00:00.000Z';
const LEASE_EXPIRES_AT = '2026-07-29T15:01:00.000Z';
const RETRY_AT = '2026-07-29T15:05:00.000Z';
const LEASE_ID = createLeaseId('0198f334-6dc5-7c20-9af1-91d7e599c001');

function message(messageId: string) {
  return {
    messageId,
    eventId: `${messageId}-event`,
    correlationId: 'correlation-123',
    availableAt: CLAIMED_AT,
    event: {
      channel: 'servir.organizations.events',
      source: 'urn:servir:organizations',
      type: 'servir.organizations.organization.created.v1',
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
    decide: () => (retry ? { retry: true, availableAt: RETRY_AT } : { retry: false }),
  };
}

function recordingRetryPolicy(): RetryPolicy & {
  readonly decisions: Array<Parameters<RetryPolicy['decide']>[0]>;
} {
  const decisions: Array<Parameters<RetryPolicy['decide']>[0]> = [];

  return {
    decisions,
    decide: (input) => {
      decisions.push(input);
      return { retry: false };
    },
  };
}

function processBatch(
  input: Readonly<{
    clock: Clock;
    store: InMemoryOutboxMessageStore;
    publisher: InMemoryIntegrationEventPublisher;
    retryPolicy: RetryPolicy;
  }>,
) {
  return new ProcessOutboxBatch({
    clock: input.clock,
    leaseIdGenerator: { generate: () => LEASE_ID },
    messageStore: input.store,
    publisher: input.publisher,
    retryPolicy: input.retryPolicy,
    batchSize: 10,
    leaseDurationMilliseconds: 60_000,
  });
}

describe('ProcessOutboxBatch', () => {
  it('traces only claimed work with message outcomes and batch totals', async () => {
    const calls: string[] = [];
    const attributes: Array<Readonly<Record<string, string | number | boolean>>> = [];
    const telemetry: RelayTelemetry = {
      async traceBatch(operation, completed) {
        calls.push('batch.started');
        const result = await operation();
        completed?.(result);
        calls.push('batch.completed');
        return result;
      },
      async traceMessage(claimedMessage, operation) {
        calls.push(`message.started:${claimedMessage.messageId}`);
        const result = await operation();
        calls.push(`message.completed:${claimedMessage.messageId}`);
        return result;
      },
      addEvent(name) {
        calls.push(name);
      },
      setAttributes(value) {
        attributes.push(value);
      },
    };
    let observed = 0;
    const process = new ProcessOutboxBatch({
      clock: new SequenceClock([CLAIMED_AT, '2026-07-29T15:00:01.000Z']),
      leaseIdGenerator: { generate: () => LEASE_ID },
      messageStore: new InMemoryOutboxMessageStore([message('message-1')]),
      publisher: new InMemoryIntegrationEventPublisher(),
      retryPolicy: retryPolicy(true),
      batchSize: 10,
      leaseDurationMilliseconds: 60_000,
      telemetry,
      onBatchCompleted: (result) => {
        observed = result.published;
      },
    });

    await process.execute();

    assert.deepEqual(calls, [
      'batch.started',
      'message.started:message-1',
      'outbox.message.published',
      'message.completed:message-1',
      'batch.completed',
    ]);
    assert.equal(observed, 1);
    assert.deepEqual(attributes, [
      {
        'servir.outbox.claimed': 1,
        'servir.outbox.published': 1,
        'servir.outbox.rescheduled': 0,
        'servir.outbox.failed': 0,
        'servir.outbox.batch_size': 10,
      },
    ]);
  });

  it('does not create semantic telemetry for an empty poll', async () => {
    let traced = false;
    const telemetry: RelayTelemetry = {
      async traceBatch(operation) {
        traced = true;
        return operation();
      },
      async traceMessage(_message, operation) {
        return operation();
      },
      addEvent() {},
      setAttributes() {},
    };
    const process = new ProcessOutboxBatch({
      clock: new SequenceClock([CLAIMED_AT]),
      leaseIdGenerator: { generate: () => LEASE_ID },
      messageStore: new InMemoryOutboxMessageStore([]),
      publisher: new InMemoryIntegrationEventPublisher(),
      retryPolicy: retryPolicy(true),
      batchSize: 10,
      leaseDurationMilliseconds: 60_000,
      telemetry,
    });

    assert.deepEqual(await process.execute(), {
      claimed: 0,
      published: 0,
      rescheduled: 0,
      failed: 0,
    });
    assert.equal(traced, false);
  });

  it('rejects every non-positive or fractional processing limit', () => {
    const store = new InMemoryOutboxMessageStore([]);
    const publisher = new InMemoryIntegrationEventPublisher();

    for (const batchSize of [0, -1, 1.5]) {
      assert.throws(
        () =>
          new ProcessOutboxBatch({
            clock: new SequenceClock([CLAIMED_AT]),
            leaseIdGenerator: { generate: () => LEASE_ID },
            messageStore: store,
            publisher,
            retryPolicy: retryPolicy(true),
            batchSize,
            leaseDurationMilliseconds: 60_000,
          }),
        (error: unknown) =>
          error instanceof ProcessOutboxBatchConfigError &&
          error.code === ProcessOutboxBatchConfigErrorCodes.InvalidBatchSize,
      );
    }
  });

  it('rejects every non-positive or fractional lease duration', () => {
    const store = new InMemoryOutboxMessageStore([]);
    const publisher = new InMemoryIntegrationEventPublisher();

    for (const leaseDurationMilliseconds of [0, -1, 1.5]) {
      assert.throws(
        () =>
          new ProcessOutboxBatch({
            clock: new SequenceClock([CLAIMED_AT]),
            leaseIdGenerator: { generate: () => LEASE_ID },
            messageStore: store,
            publisher,
            retryPolicy: retryPolicy(true),
            batchSize: 10,
            leaseDurationMilliseconds,
          }),
        (error: unknown) =>
          error instanceof ProcessOutboxBatchConfigError &&
          error.code === ProcessOutboxBatchConfigErrorCodes.InvalidLeaseDuration,
      );
    }
  });

  it('publishes claimed messages and reschedules a transient failure', async () => {
    const store = new InMemoryOutboxMessageStore([message('message-1'), message('message-2')]);
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
    assert.equal(store.currentMessages[0]?.publishedAt, '2026-07-29T15:00:01.000Z');
    assert.equal(store.currentMessages[1]?.availableAt, RETRY_AT);
    assert.equal(store.currentMessages[1]?.lastErrorCode, 'kafka.unavailable');
  });

  it('marks a publication failure as terminal when retry is denied', async () => {
    const store = new InMemoryOutboxMessageStore([message('message-1')]);
    const publisher = new InMemoryIntegrationEventPublisher({
      'message-1': 'kafka.message_rejected',
    });
    const worker = processBatch({
      clock: new SequenceClock([CLAIMED_AT, '2026-07-29T15:00:01.000Z']),
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
    assert.equal(store.currentMessages[0]?.failedAt, '2026-07-29T15:00:01.000Z');
  });

  it('passes explicit publication retryability to the retry policy', async () => {
    const store = new InMemoryOutboxMessageStore([message('message-1')]);
    const retry = recordingRetryPolicy();
    const publisher = {
      publish: async () => {
        throw new IntegrationEventPublicationError('kafka.message_rejected', { retryable: false });
      },
    };
    const worker = new ProcessOutboxBatch({
      clock: new SequenceClock([CLAIMED_AT, '2026-07-29T15:00:01.000Z']),
      leaseIdGenerator: { generate: () => LEASE_ID },
      messageStore: store,
      publisher,
      retryPolicy: retry,
      batchSize: 10,
      leaseDurationMilliseconds: 60_000,
    });

    await worker.execute();

    assert.equal(retry.decisions[0]?.retryable, false);
    assert.equal(retry.decisions[0]?.errorCode, 'kafka.message_rejected');
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
      (error: unknown) =>
        error instanceof OutboxLeaseError && error.code === OutboxLeaseErrorCodes.Expired,
    );
    assert.equal(publisher.messages.length, 1);
    assert.equal(store.currentMessages[0]?.publishedAt, undefined);
  });
});
