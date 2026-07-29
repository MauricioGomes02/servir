import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createOrganizationCreated,
  OrganizationId,
  OrganizationName,
} from '@/modules/organizations/domain';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';

import { mapOrganizationCreatedIntegrationEvent } from './map-organization-created-integration-event';

function organizationCreated() {
  const eventId = parseDomainEventId(
    '0198f334-6dc5-7c20-9af1-91d7e599e001',
  );
  const occurredAt = Instant.create('2026-07-29T15:00:00.000Z');
  const organizationId = OrganizationId.create(
    '0198f334-6dc5-7c20-9af1-91d7e599e002',
  );
  const name = OrganizationName.create('Community Servir');

  assert.equal(eventId.success, true);
  assert.equal(occurredAt.success, true);
  assert.equal(organizationId.success, true);
  assert.equal(name.success, true);

  if (
    !eventId.success
    || !occurredAt.success
    || !organizationId.success
    || !name.success
  ) {
    throw new Error('Invalid deterministic integration event fixture');
  }

  return createOrganizationCreated({
    eventId: eventId.value,
    occurredAt: occurredAt.value,
    organizationId: organizationId.value,
    name: name.value,
  });
}

describe('mapOrganizationCreatedIntegrationEvent', () => {
  it('creates the versioned public contract with aggregate partitioning', () => {
    const domainEvent = organizationCreated();

    const integrationEvent = mapOrganizationCreatedIntegrationEvent(domainEvent);

    assert.deepEqual(integrationEvent, {
      name: 'organization.created',
      version: 1,
      occurredAt: domainEvent.occurredAt.toISOString(),
      aggregateId: domainEvent.payload.organizationId,
      partitionKey: domainEvent.payload.organizationId,
      payload: {
        organizationId: domainEvent.payload.organizationId,
        name: 'Community Servir',
      },
      metadata: {},
    });
    assert.equal('eventId' in integrationEvent, false);
    assert.equal(Object.isFrozen(integrationEvent), true);
    assert.equal(Object.isFrozen(integrationEvent.payload), true);
  });
});
