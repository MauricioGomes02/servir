import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createExecutionContext,
  parseCorrelationId,
} from '@/shared/application/context';
import {
  createEventEnvelope,
  parseMessageId,
} from '@/shared/application/messaging';
import {
  createDomainEvent,
  parseDomainEventId,
} from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';

import { InMemoryEventOutbox } from '.';
import {
  InMemoryEventOutboxAcknowledgementError,
  InMemoryEventOutboxAcknowledgementErrorCode,
} from './in-memory-event-outbox-acknowledgement-error';

describe('InMemoryEventOutbox', () => {
  it('stores envelopes in order and exposes an immutable snapshot', async () => {
    const messageId = parseMessageId(
      '0198f334-6dc5-7c20-9af1-91d7e599c7b3',
    );
    const eventId = parseDomainEventId(
      '0198f334-6dc5-7c20-9af1-91d7e599c7b2',
    );
    const correlationId = parseCorrelationId('correlation-123');
    const occurredAt = Instant.create('2026-07-28T15:00:00.000Z');

    assert.equal(messageId.success, true);
    assert.equal(eventId.success, true);
    assert.equal(correlationId.success, true);
    assert.equal(occurredAt.success, true);

    if (
      !messageId.success
      || !eventId.success
      || !correlationId.success
      || !occurredAt.success
    ) {
      throw new Error('Invalid deterministic test fixture');
    }

    const context = createExecutionContext({
      correlationId: correlationId.value,
    });
    const envelope = createEventEnvelope({
      messageId: messageId.value,
      correlationId: context.correlationId,
      event: createDomainEvent({
        eventId: eventId.value,
        name: 'organization.created',
        occurredAt: occurredAt.value,
        payload: { organizationId: 'organization-123' },
      }),
    });
    const outbox = new InMemoryEventOutbox();

    await outbox.add([envelope]);
    const snapshot = outbox.envelopes;

    assert.equal(Object.isFrozen(snapshot), true);
    assert.deepEqual(snapshot, [envelope]);
    assert.deepEqual(outbox.nextEnvelope, envelope);

    outbox.acknowledge(envelope.messageId);

    assert.equal(outbox.nextEnvelope, undefined);
    assert.equal(outbox.envelopes.length, 0);
  });

  it('rejects acknowledgement outside outbox order', async () => {
    const storedMessageId = parseMessageId(
      '0198f334-6dc5-7c20-9af1-91d7e599c7b3',
    );
    const receivedMessageId = parseMessageId(
      '0198f334-6dc5-7c20-9af1-91d7e599c7b4',
    );
    const eventId = parseDomainEventId(
      '0198f334-6dc5-7c20-9af1-91d7e599c7b2',
    );
    const correlationId = parseCorrelationId('correlation-123');
    const occurredAt = Instant.create('2026-07-28T15:00:00.000Z');

    assert.equal(storedMessageId.success, true);
    assert.equal(receivedMessageId.success, true);
    assert.equal(eventId.success, true);
    assert.equal(correlationId.success, true);
    assert.equal(occurredAt.success, true);

    if (
      !storedMessageId.success
      || !receivedMessageId.success
      || !eventId.success
      || !correlationId.success
      || !occurredAt.success
    ) {
      throw new Error('Invalid deterministic test fixture');
    }

    const envelope = createEventEnvelope({
      messageId: storedMessageId.value,
      correlationId: correlationId.value,
      event: createDomainEvent({
        eventId: eventId.value,
        name: 'organization.created',
        occurredAt: occurredAt.value,
        payload: { organizationId: 'organization-123' },
      }),
    });
    const outbox = new InMemoryEventOutbox();
    await outbox.add([envelope]);

    assert.throws(
      () => outbox.acknowledge(receivedMessageId.value),
      (error) => error instanceof InMemoryEventOutboxAcknowledgementError
        && error.code === InMemoryEventOutboxAcknowledgementErrorCode,
    );
    assert.equal(outbox.nextEnvelope?.messageId, envelope.messageId);
  });
});
