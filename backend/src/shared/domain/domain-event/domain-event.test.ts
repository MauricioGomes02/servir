import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createDomainEvent,
  DomainEventMetadataErrorCodes,
  parseDomainEventId,
} from '.';
import { Instant } from '@/shared/domain/instant';

describe('DomainEvent', () => {
  it('cria um fato profundamente imutavel com metadados explicitos', () => {
    const eventId = parseDomainEventId('event-123');
    const occurredAt = Instant.create(
      '2026-07-27T12:00:00.000Z',
    );

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

  it('preserva o payload original ao criar a copia imutavel', () => {
    const eventId = parseDomainEventId('event-123');
    const occurredAt = Instant.create(
      '2026-07-27T12:00:00.000Z',
    );

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

  it('rejeita identidade de evento vazia', () => {
    const result = parseDomainEventId('   ');

    assert.deepEqual(result, {
      success: false,
      error: {
        code: DomainEventMetadataErrorCodes.Empty,
        field: 'eventId',
      },
    });
  });
});
