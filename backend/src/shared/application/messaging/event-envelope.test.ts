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

const EVENT_ID = '0198f334-6dc5-7c20-9af1-91d7e599c7b2';
const MESSAGE_ID = '0198f334-6dc5-7c20-9af1-91d7e599c7b3';
const CAUSATION_ID = '0198f334-6dc5-7c20-9af1-91d7e599c7b4';

function fixtures() {
  const eventId = parseDomainEventId(EVENT_ID);
  const occurredAt = Instant.create(
    '2026-07-27T15:00:00.000Z',
  );
  const messageId = parseMessageId(MESSAGE_ID);
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
    const causationId = parseMessageId(CAUSATION_ID);

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
  it('normalizes a canonical UUID received at the boundary', () => {
    const result = parseMessageId(` ${MESSAGE_ID.toUpperCase()} `);

    assert.deepEqual(result, {
      success: true,
      value: MESSAGE_ID,
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

  it('rejects a non-UUID message identity', () => {
    assert.deepEqual(parseMessageId('message-123'), {
      success: false,
      error: {
        code: MessageIdErrorCodes.InvalidFormat,
        field: 'messageId',
      },
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
