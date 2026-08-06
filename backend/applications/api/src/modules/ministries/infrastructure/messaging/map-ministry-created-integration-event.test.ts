import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { OrganizationId } from '@/modules/organizations/domain';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';
import { createMinistryCreated, MinistryId, MinistryName } from '../../domain';
import { mapMinistryCreatedIntegrationEvent } from './map-ministry-created-integration-event';

function value<T>(result: { success: true; value: T } | { success: false }): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('Invalid deterministic fixture');
  return result.value;
}

describe('mapMinistryCreatedIntegrationEvent', () => {
  it('creates the versioned public contract partitioned by organization', () => {
    const event = createMinistryCreated({
      eventId: value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599e021')),
      occurredAt: value(Instant.create('2026-08-06T12:00:00.000Z')),
      ministryId: value(MinistryId.create('0198f334-6dc5-7c20-9af1-91d7e599e022')),
      organizationId: value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599e023')),
      name: value(MinistryName.create('Louvor')),
    });
    const mapped = mapMinistryCreatedIntegrationEvent(event);
    assert.equal(mapped.channel, 'servir.ministries.events');
    assert.equal(mapped.type, 'servir.ministries.ministry.created.v1');
    assert.equal(mapped.partitionKey, event.payload.organizationId);
    assert.deepEqual(mapped.payload, { ...event.payload, status: 'active' });
  });
});
