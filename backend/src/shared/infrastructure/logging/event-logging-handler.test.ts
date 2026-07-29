import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseCorrelationId } from '@/shared/application/context';
import {
  createEventEnvelope,
  parseMessageId,
} from '@/shared/application/messaging';
import {
  createDomainEvent,
  parseDomainEventId,
} from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';

import {
  EventLoggingHandler,
  InMemoryLogger,
} from '.';

function fixture() {
  const eventId = parseDomainEventId('event-123');
  const occurredAt = Instant.create('2026-07-27T15:00:00.000Z');
  const messageId = parseMessageId('message-123');
  const causationId = parseMessageId('message-previous');
  const correlationId = parseCorrelationId('correlation-123');

  assert.equal(eventId.success, true);
  assert.equal(occurredAt.success, true);
  assert.equal(messageId.success, true);
  assert.equal(causationId.success, true);
  assert.equal(correlationId.success, true);

  if (
    !eventId.success
    || !occurredAt.success
    || !messageId.success
    || !causationId.success
    || !correlationId.success
  ) {
    throw new Error('Invalid deterministic test fixture');
  }

  return createEventEnvelope({
    messageId: messageId.value,
    causationId: causationId.value,
    correlationId: correlationId.value,
    event: createDomainEvent({
      eventId: eventId.value,
      name: 'organization.created',
      occurredAt: occurredAt.value,
      payload: {
        organizationId: 'organization-123',
        name: 'Dado que nao deve aparecer no log',
      },
    }),
  });
}

describe('EventLoggingHandler', () => {
  it('logs structured metadata without copying the payload', async () => {
    const logger = new InMemoryLogger();
    const handler = new EventLoggingHandler(logger);
    const envelope = fixture();

    await handler.handle(envelope);

    assert.equal(handler.handlerName, 'observability.event_logging');
    assert.deepEqual(logger.records, [
      {
        level: 'info',
        eventName: 'organization.created',
        occurredAt: envelope.event.occurredAt,
        context: {
          correlationId: envelope.correlationId,
          messageId: envelope.messageId,
          causationId: envelope.causationId,
        },
        attributes: {
          'event.id': envelope.event.eventId,
        },
      },
    ]);
    assert.equal(
      JSON.stringify(logger.records).includes('organization-123'),
      false,
    );
    assert.equal(
      JSON.stringify(logger.records).includes(
        'Dado que nao deve aparecer no log',
      ),
      false,
    );
  });
});
