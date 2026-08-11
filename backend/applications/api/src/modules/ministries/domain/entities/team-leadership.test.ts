import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { OrganizationId } from '@/modules/organizations/domain';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';
import { MinistryId, MinistryTeamId, TeamLeadership, TeamLeadershipId, TeamMembershipId } from '.';

function value<T>(result: { success: true; value: T } | { success: false }): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('Invalid fixture');
  return result.value;
}

describe('TeamLeadership', () => {
  it('appoints an active team leader and records the occurred fact', () => {
    const leadership = TeamLeadership.appoint({
      id: value(TeamLeadershipId.create('0198f334-6dc5-7c20-9af1-91d7e599ff01')),
      organizationId: value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599ff02')),
      ministryId: value(MinistryId.create('0198f334-6dc5-7c20-9af1-91d7e599ff03')),
      ministryTeamId: value(MinistryTeamId.create('0198f334-6dc5-7c20-9af1-91d7e599ff04')),
      teamMembershipId: value(TeamMembershipId.create('0198f334-6dc5-7c20-9af1-91d7e599ff05')),
      eventId: value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599ff06')),
      appointedAt: value(Instant.create('2026-08-11T12:00:00.000Z')),
    });
    assert.equal(leadership.status, 'active');
    assert.equal(leadership.pendingDomainEvents[0]?.name, 'team_leader.appointed');
  });
});
