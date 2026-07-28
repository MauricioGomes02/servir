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

describe('InMemoryEventOutbox', () => {
  it('armazena envelopes em ordem e expoe snapshot imutavel', async () => {
    const messageId = parseMessageId('message-123');
    const eventId = parseDomainEventId('event-123');
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
  });
});
