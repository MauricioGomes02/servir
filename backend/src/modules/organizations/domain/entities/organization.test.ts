import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  parseDomainEventId,
} from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';

import {
  Organization,
  OrganizationId,
} from '.';
import { OrganizationNameErrorCodes } from '../value-objects';

function validMetadata() {
  const id = OrganizationId.create('organization-123');
  const eventId = parseDomainEventId('event-123');
  const occurredAt = Instant.create('2026-07-28T15:00:00.000Z');

  assert.equal(id.success, true);
  assert.equal(eventId.success, true);
  assert.equal(occurredAt.success, true);

  if (!id.success || !eventId.success || !occurredAt.success) {
    throw new Error('Invalid deterministic test fixture');
  }

  return {
    id: id.value,
    eventId: eventId.value,
    occurredAt: occurredAt.value,
  };
}

describe('Organization', () => {
  it('creates a valid organization and records the occurred fact', () => {
    const metadata = validMetadata();

    const result = Organization.create({
      ...metadata,
      name: '  Comunidade Servir  ',
    });

    assert.equal(result.success, true);

    if (!result.success) {
      return;
    }

    assert.equal(result.value.id, metadata.id);
    assert.equal(result.value.name.toString(), 'Comunidade Servir');
    assert.equal(result.value.pendingDomainEvents.length, 1);
    assert.deepEqual(result.value.pendingDomainEvents[0], {
      eventId: metadata.eventId,
      name: 'organization.created',
      occurredAt: metadata.occurredAt,
      payload: {
        organizationId: 'organization-123',
        name: 'Comunidade Servir',
      },
    });
  });

  it('creates neither organization nor fact when the name is invalid', () => {
    const result = Organization.create({
      ...validMetadata(),
      name: '   ',
    });

    assert.deepEqual(result, {
      success: false,
      error: {
        code: OrganizationNameErrorCodes.Empty,
        field: 'name',
      },
    });
  });
});
