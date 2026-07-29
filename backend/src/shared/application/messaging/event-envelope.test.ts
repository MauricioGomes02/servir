import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseCorrelationId } from '@/shared/application/context';
import {
  createDomainEvent,
  parseDomainEventId,
} from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';

import {
  createEventEnvelope,
  MessageIdErrorCodes,
  parseMessageId,
} from '.';

function fixtures() {
  const eventId = parseDomainEventId('event-123');
  const occurredAt = Instant.create(
    '2026-07-27T15:00:00.000Z',
  );
  const messageId = parseMessageId('message-123');
  const correlationId = parseCorrelationId('correlation-123');

  assert.equal(eventId.success, true);
  assert.equal(occurredAt.success, true);
  assert.equal(messageId.success, true);
  assert.equal(correlationId.success, true);

  if (
    !eventId.success
    || !occurredAt.success
    || !messageId.success
    || !correlationId.success
  ) {
    throw new Error('Invalid deterministic test fixture');
  }

  return {
    event: createDomainEvent({
      eventId: eventId.value,
      name: 'organization.created',
      occurredAt: occurredAt.value,
      payload: {
        organizationId: 'organization-123',
      },
    }),
    messageId: messageId.value,
    correlationId: correlationId.value,
  };
}

describe('EventEnvelope', () => {
  it('associates an event and metadata in an immutable envelope', () => {
    const fixture = fixtures();

    const envelope = createEventEnvelope(fixture);

    assert.equal(envelope.event, fixture.event);
    assert.equal(envelope.messageId, fixture.messageId);
    assert.equal(envelope.correlationId, fixture.correlationId);
    assert.equal(envelope.causationId, undefined);
    assert.equal(Object.isFrozen(envelope), true);
  });

  it('preserves the message that caused the event', () => {
    const fixture = fixtures();
    const causationId = parseMessageId('command-123');

    assert.equal(causationId.success, true);

    if (!causationId.success) {
      return;
    }

    const envelope = createEventEnvelope({
      ...fixture,
      causationId: causationId.value,
    });

    assert.equal(envelope.causationId, causationId.value);
  });
});

describe('MessageId', () => {
  it('normalizes an identifier received at the boundary', () => {
    const result = parseMessageId(' message-123 ');

    assert.deepEqual(result, {
      success: true,
      value: 'message-123',
    });
  });

  it('rejects an identifier with an invalid type', () => {
    const result = parseMessageId(123);

    assert.deepEqual(result, {
      success: false,
      error: {
        code: MessageIdErrorCodes.InvalidType,
        field: 'messageId',
      },
    });
  });

  it('rejects an empty identifier', () => {
    const result = parseMessageId('   ');

    assert.deepEqual(result, {
      success: false,
      error: {
        code: MessageIdErrorCodes.Empty,
        field: 'messageId',
      },
    });
  });

  it('accepts an identifier with exactly 128 characters', () => {
    const input = 'a'.repeat(128);

    assert.deepEqual(parseMessageId(input), {
      success: true,
      value: input,
    });
  });

  it('rejects an external identifier longer than 128 characters', () => {
    const result = parseMessageId('a'.repeat(129));

    assert.deepEqual(result, {
      success: false,
      error: {
        code: MessageIdErrorCodes.TooLong,
        field: 'messageId',
        params: {
          maxLength: 128,
          actualLength: 129,
        },
      },
    });
  });
});
