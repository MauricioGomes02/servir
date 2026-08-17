import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseCorrelationId, type CorrelationId } from '@/shared/application/context';
import type { Logger } from '@/shared/application/logging';
import {
  createEventEnvelope,
  parseMessageId,
  type EventEnvelope,
  type EventPublisher,
  type MessageId,
} from '@/shared/application/messaging';
import {
  createDomainEvent,
  parseDomainEventId,
  type DomainEventId,
} from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';
import { InMemoryLogger } from '@/shared/infrastructure/logging';

import { InMemoryEventOutbox } from './in-memory-event-outbox';
import { InMemoryEventOutboxRelay } from './in-memory-event-outbox-relay';
import {
  InMemoryEventOutboxRelayError,
  InMemoryEventOutboxRelayErrorCodes,
} from './in-memory-event-outbox-relay-error';

interface EnvelopeIds {
  readonly correlationId: CorrelationId;
  readonly eventId: DomainEventId;
  readonly messageId: MessageId;
}

function ids(): EnvelopeIds {
  const correlationId = parseCorrelationId('correlation-123');
  const eventId = parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599c7b2');
  const messageId = parseMessageId('0198f334-6dc5-7c20-9af1-91d7e599c7b3');

  assert.equal(correlationId.success, true);
  assert.equal(eventId.success, true);
  assert.equal(messageId.success, true);

  if (!correlationId.success || !eventId.success || !messageId.success) {
    throw new Error('Invalid deterministic test fixture');
  }

  return {
    correlationId: correlationId.value,
    eventId: eventId.value,
    messageId: messageId.value,
  };
}

function envelope(): EventEnvelope {
  const envelopeIds = ids();
  const occurredAt = Instant.create('2026-07-28T15:00:00.000Z');
  assert.equal(occurredAt.success, true);

  if (!occurredAt.success) {
    throw new Error('Invalid deterministic test fixture');
  }

  return createEventEnvelope({
    messageId: envelopeIds.messageId,
    correlationId: envelopeIds.correlationId,
    event: createDomainEvent({
      eventId: envelopeIds.eventId,
      name: 'organization.created',
      occurredAt: occurredAt.value,
      payload: { organizationId: 'organization-123' },
    }),
  });
}

async function relayFixture(publisher: EventPublisher, logger: Logger = new InMemoryLogger()) {
  const outbox = new InMemoryEventOutbox();
  await outbox.add([envelope()]);

  return {
    logger,
    outbox,
    relay: new InMemoryEventOutboxRelay(outbox, publisher, logger),
  };
}

describe('InMemoryEventOutboxRelay', () => {
  it('publishes and acknowledges pending envelopes in order', async () => {
    const published: EventEnvelope[] = [];
    const publisher: EventPublisher = {
      async publish(pendingEnvelope): Promise<void> {
        published.push(pendingEnvelope);
      },
    };
    const { outbox, relay } = await relayFixture(publisher);

    await relay.flush();

    assert.equal(published.length, 1);
    assert.equal(published[0]?.messageId, '0198f334-6dc5-7c20-9af1-91d7e599c7b3');
    assert.equal(outbox.envelopes.length, 0);
  });

  it('keeps the envelope pending and logs the failure for retry', async () => {
    const logger = new InMemoryLogger();
    const failure = new Error('email provider unavailable');
    const publisher: EventPublisher = {
      async publish(): Promise<void> {
        throw failure;
      },
    };
    const { outbox, relay } = await relayFixture(publisher, logger);

    await assert.rejects(
      relay.flush(),
      (error) =>
        error instanceof InMemoryEventOutboxRelayError &&
        error.code === InMemoryEventOutboxRelayErrorCodes.PublishFailed &&
        error.cause === failure,
    );

    assert.equal(outbox.envelopes.length, 1);
    assert.equal(logger.records.length, 1);
    assert.equal(logger.records[0]?.eventName, 'event.outbox.publish.failed');
    assert.deepEqual(logger.records[0]?.context, {
      correlationId: 'correlation-123',
      messageId: '0198f334-6dc5-7c20-9af1-91d7e599c7b3',
    });
  });

  it('shares an active execution without publishing duplicates', async () => {
    let release: (() => void) | undefined;
    let publications = 0;
    const publisher: EventPublisher = {
      async publish(): Promise<void> {
        publications += 1;
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      },
    };
    const { relay } = await relayFixture(publisher);

    const firstFlush = relay.flush();
    const secondFlush = relay.flush();

    assert.equal(firstFlush, secondFlush);
    assert.equal(publications, 1);
    assert.ok(release);
    release();
    await firstFlush;

    assert.equal(publications, 1);
  });
});
