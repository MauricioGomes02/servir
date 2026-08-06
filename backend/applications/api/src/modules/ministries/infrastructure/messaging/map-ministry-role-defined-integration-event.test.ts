import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { OrganizationId } from '@/modules/organizations/domain';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';
import { createMinistryRoleDefined, MinistryId, MinistryRoleId, MinistryRoleName } from '../../domain';
import { mapMinistryRoleDefinedIntegrationEvent } from './map-ministry-role-defined-integration-event';
function value<T>(result: { success: true; value: T } | { success: false }): T { assert.equal(result.success, true); if (!result.success) throw new Error('fixture'); return result.value; }
describe('mapMinistryRoleDefinedIntegrationEvent', () => {
  it('creates the versioned public contract partitioned by organization', () => {
    const event = createMinistryRoleDefined({
      eventId: value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599e111')),
      occurredAt: value(Instant.create('2026-08-06T15:00:00.000Z')),
      ministryId: value(MinistryId.create('0198f334-6dc5-7c20-9af1-91d7e599e112')),
      organizationId: value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599e113')),
      ministryRoleId: value(MinistryRoleId.create('0198f334-6dc5-7c20-9af1-91d7e599e114')),
      name: value(MinistryRoleName.create('Vocal')),
    });
    const mapped = mapMinistryRoleDefinedIntegrationEvent(event);
    assert.equal(mapped.channel, 'servir.ministries.events');
    assert.equal(mapped.type, 'servir.ministries.ministry.role-defined.v1');
    assert.equal(mapped.partitionKey, event.payload.organizationId);
    assert.deepEqual(mapped.payload, { ...event.payload, status: 'active' });
  });
});
