import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MemberId } from '@/modules/membership/domain';
import { OrganizationId } from '@/modules/organizations/domain';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';
import { createMinistryMembershipRequested, MinistryId, MinistryMembershipId } from '../../domain';
import { mapMinistryMembershipRequestedIntegrationEvent } from './map-ministry-membership-requested-integration-event';
function value<T>(result: { success: true; value: T } | { success: false }): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('fixture');
  return result.value;
}
describe('mapMinistryMembershipRequestedIntegrationEvent', () => {
  it('creates the versioned public contract partitioned by organization', () => {
    const event = createMinistryMembershipRequested({
      eventId: value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599e221')),
      occurredAt: value(Instant.create('2026-08-07T12:00:00.000Z')),
      ministryMembershipId: value(
        MinistryMembershipId.create('0198f334-6dc5-7c20-9af1-91d7e599e222'),
      ),
      organizationId: value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599e223')),
      ministryId: value(MinistryId.create('0198f334-6dc5-7c20-9af1-91d7e599e224')),
      memberId: value(MemberId.create('0198f334-6dc5-7c20-9af1-91d7e599e225')),
    });
    const mapped = mapMinistryMembershipRequestedIntegrationEvent(event);
    assert.equal(mapped.type, 'servir.ministries.ministry-membership.requested.v1');
    assert.equal(mapped.partitionKey, event.payload.organizationId);
    assert.equal(mapped.payload.status, 'requested');
  });
});
