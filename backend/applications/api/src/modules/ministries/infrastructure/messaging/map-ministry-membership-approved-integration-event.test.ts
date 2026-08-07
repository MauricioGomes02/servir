import assert from 'node:assert/strict';
import { it } from 'node:test';
import { MemberId } from '@/modules/membership/domain';
import { OrganizationId } from '@/modules/organizations/domain';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';
import { createMinistryMembershipApproved, MinistryId, MinistryMembershipId } from '../../domain';
import { mapMinistryMembershipApprovedIntegrationEvent } from './map-ministry-membership-approved-integration-event';
function value<T>(result: { success: true; value: T } | { success: false }): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('fixture');
  return result.value;
}
it('maps ministry membership approval to the versioned public contract', () => {
  const event = createMinistryMembershipApproved({
    eventId: value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599e231')),
    occurredAt: value(Instant.create('2026-08-07T13:00:00.000Z')),
    ministryMembershipId: value(
      MinistryMembershipId.create('0198f334-6dc5-7c20-9af1-91d7e599e232'),
    ),
    organizationId: value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599e233')),
    ministryId: value(MinistryId.create('0198f334-6dc5-7c20-9af1-91d7e599e234')),
    memberId: value(MemberId.create('0198f334-6dc5-7c20-9af1-91d7e599e235')),
  });
  const mapped = mapMinistryMembershipApprovedIntegrationEvent(event);
  assert.equal(mapped.type, 'servir.ministries.ministry-membership.approved.v1');
  assert.equal(mapped.partitionKey, event.payload.organizationId);
  assert.equal(mapped.payload.status, 'active');
});
