import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createDomainEvent, DomainEventMetadataErrorCodes, parseDomainEventId } from '.';
import { Instant } from '@/shared/domain/instant';

describe('DomainEvent', () => {
  const EVENT_ID = '0198f334-6dc5-7c20-9af1-91d7e599c7b2';

  it('creates a deeply immutable fact with explicit metadata', () => {
    const eventId = parseDomainEventId(EVENT_ID);
    const occurredAt = Instant.create('2026-07-27T12:00:00.000Z');

    assert.equal(eventId.success, true);
    assert.equal(occurredAt.success, true);

    if (!eventId.success || !occurredAt.success) {
      return;
    }

    const sourcePayload = {
      organizationId: 'organization-123',
      changes: {
        fields: ['name'],
      },
    };

    const event = createDomainEvent({
      eventId: eventId.value,
      name: 'organization.updated',
      occurredAt: occurredAt.value,
      payload: sourcePayload,
    });

    assert.equal(event.name, 'organization.updated');
    assert.equal(Object.isFrozen(event), true);
    assert.equal(Object.isFrozen(event.payload), true);
    assert.equal(Object.isFrozen(event.payload.changes), true);
    assert.equal(Object.isFrozen(event.payload.changes.fields), true);
    assert.notEqual(event.payload, sourcePayload);
  });

  it('preserves the original payload while creating an immutable copy', () => {
    const eventId = parseDomainEventId(EVENT_ID);
    const occurredAt = Instant.create('2026-07-27T12:00:00.000Z');

    assert.equal(eventId.success, true);
    assert.equal(occurredAt.success, true);

    if (!eventId.success || !occurredAt.success) {
      return;
    }

    const sourcePayload = {
      fields: ['name'],
    };

    createDomainEvent({
      eventId: eventId.value,
      name: 'organization.updated',
      occurredAt: occurredAt.value,
      payload: sourcePayload,
    });

    assert.equal(Object.isFrozen(sourcePayload), false);
    assert.equal(Object.isFrozen(sourcePayload.fields), false);
  });

  it('rejects an event identity with an invalid type', () => {
    assert.deepEqual(parseDomainEventId(123), {
      success: false,
      error: {
        code: DomainEventMetadataErrorCodes.InvalidType,
        field: 'eventId',
      },
    });
  });

  it('rejects an empty event identity', () => {
    const result = parseDomainEventId('   ');

    assert.deepEqual(result, {
      success: false,
      error: {
        code: DomainEventMetadataErrorCodes.Empty,
        field: 'eventId',
      },
    });
  });

  it('rejects a non-UUID event identity', () => {
    assert.deepEqual(parseDomainEventId('event-123'), {
      success: false,
      error: {
        code: DomainEventMetadataErrorCodes.InvalidFormat,
        field: 'eventId',
      },
    });
  });

  it('rejects an event identity longer than 128 characters', () => {
    assert.deepEqual(parseDomainEventId('a'.repeat(129)), {
      success: false,
      error: {
        code: DomainEventMetadataErrorCodes.TooLong,
        field: 'eventId',
        params: {
          maxLength: 128,
          actualLength: 129,
        },
      },
    });
  });
});
