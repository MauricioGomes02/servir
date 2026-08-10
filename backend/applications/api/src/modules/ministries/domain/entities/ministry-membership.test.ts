import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MemberId } from '@/modules/membership/domain';
import { OrganizationId } from '@/modules/organizations/domain';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';
import {
  MinistryId,
  MinistryMembership,
  MinistryMembershipApprovalErrorCodes,
  MinistryMembershipId,
  MinistryRoleId,
  MinistryRoleQualificationErrorCodes,
  MinistryRoleQualificationId,
} from '.';

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
  it('approves a requested membership and records the occurred fact', () => {
    const membership = MinistryMembership.request({
      id: value(MinistryMembershipId.create('0198f334-6dc5-7c20-9af1-91d7e599e211')),
      organizationId: value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599e212')),
      ministryId: value(MinistryId.create('0198f334-6dc5-7c20-9af1-91d7e599e213')),
      memberId: value(MemberId.create('0198f334-6dc5-7c20-9af1-91d7e599e214')),
      eventId: value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599e215')),
      requestedAt: value(Instant.create('2026-08-07T12:00:00.000Z')),
    });
    membership.acknowledgeDomainEvents(membership.pendingDomainEvents);
    const approvedAt = value(Instant.create('2026-08-07T13:00:00.000Z'));
    const result = membership.approve({
      eventId: value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599e216')),
      occurredAt: approvedAt,
    });
    assert.equal(result.success, true);
    assert.equal(membership.status, 'active');
    assert.equal(membership.approvedAt, approvedAt);
    assert.equal(membership.pendingDomainEvents[0]?.name, 'ministry_membership.approved');
  });
  it('rejects approval outside requested without mutation or event', () => {
    const instant = value(Instant.create('2026-08-07T13:00:00.000Z'));
    const membership = MinistryMembership.reconstitute({
      id: value(MinistryMembershipId.create('0198f334-6dc5-7c20-9af1-91d7e599e221')),
      organizationId: value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599e222')),
      ministryId: value(MinistryId.create('0198f334-6dc5-7c20-9af1-91d7e599e223')),
      memberId: value(MemberId.create('0198f334-6dc5-7c20-9af1-91d7e599e224')),
      status: 'active',
      requestedAt: instant,
      approvedAt: instant,
    });
    const result = membership.approve({
      eventId: value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599e225')),
      occurredAt: instant,
    });
    assert.equal(
      result.success ? undefined : result.error.code,
      MinistryMembershipApprovalErrorCodes.NotRequested,
    );
    assert.equal(membership.status, 'active');
    assert.equal(membership.pendingDomainEvents.length, 0);
  });
  it('qualifies an active membership once for a ministry role', () => {
    const instant = value(Instant.create('2026-08-07T14:00:00.000Z'));
    const membership = MinistryMembership.reconstitute({
      id: value(MinistryMembershipId.create('0198f334-6dc5-7c20-9af1-91d7e599e231')),
      organizationId: value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599e232')),
      ministryId: value(MinistryId.create('0198f334-6dc5-7c20-9af1-91d7e599e233')),
      memberId: value(MemberId.create('0198f334-6dc5-7c20-9af1-91d7e599e234')),
      status: 'active',
      requestedAt: instant,
      approvedAt: instant,
    });
    const ministryRoleId = value(MinistryRoleId.create('0198f334-6dc5-7c20-9af1-91d7e599e235'));
    const first = membership.qualifyForRole({
      id: value(MinistryRoleQualificationId.create('0198f334-6dc5-7c20-9af1-91d7e599e236')),
      ministryRoleId,
      eventId: value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599e237')),
      occurredAt: instant,
    });
    const repeated = membership.qualifyForRole({
      id: value(MinistryRoleQualificationId.create('0198f334-6dc5-7c20-9af1-91d7e599e238')),
      ministryRoleId,
      eventId: value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599e239')),
      occurredAt: instant,
    });
    assert.equal(first.success, true);
    assert.equal(
      repeated.success ? undefined : repeated.error.code,
      MinistryRoleQualificationErrorCodes.ActiveQualificationAlreadyExists,
    );
    assert.equal(membership.roleQualifications.length, 1);
    assert.equal(membership.pendingDomainEvents[0]?.name, 'member.qualified_for_ministry_role');
  });
});
