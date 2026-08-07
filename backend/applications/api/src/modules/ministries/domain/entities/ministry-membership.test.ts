import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MemberId } from '@/modules/membership/domain';
import { OrganizationId } from '@/modules/organizations/domain';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';
import { MinistryId, MinistryMembership, MinistryMembershipId } from '.';

function value<T>(result: { success: true; value: T } | { success: false }): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('Invalid deterministic fixture');
  return result.value;
}
describe('MinistryMembership', () => {
  it('requests a current membership and records the occurred fact', () => {
    const membership = MinistryMembership.request({
      id: value(MinistryMembershipId.create('0198f334-6dc5-7c20-9af1-91d7e599e201')),
      organizationId: value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599e202')),
      ministryId: value(MinistryId.create('0198f334-6dc5-7c20-9af1-91d7e599e203')),
      memberId: value(MemberId.create('0198f334-6dc5-7c20-9af1-91d7e599e204')),
      eventId: value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599e205')),
      requestedAt: value(Instant.create('2026-08-07T12:00:00.000Z')),
    });
    assert.equal(membership.status, 'requested');
    assert.equal(membership.pendingDomainEvents[0]?.name, 'ministry_membership.requested');
    assert.equal(
      membership.pendingDomainEvents[0]?.payload.memberId,
      membership.memberId.toString(),
    );
  });
});
