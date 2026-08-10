import assert from 'node:assert/strict';
import { it } from 'node:test';
import { OrganizationId } from '@/modules/organizations/domain';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';
import {
  createMemberAssignedToTeam,
  MinistryId,
  MinistryMembershipId,
  MinistryTeamId,
  TeamMembershipId,
} from '../../domain';
import { mapMemberAssignedToTeamIntegrationEvent } from './map-member-assigned-to-team-integration-event';
function value<T>(result: { success: true; value: T } | { success: false }): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('Invalid fixture');
  return result.value;
}
it('maps a team assignment to the versioned public contract', () => {
  const event = createMemberAssignedToTeam({
    eventId: value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599fe01')),
    occurredAt: value(Instant.create('2026-08-10T12:00:00.000Z')),
    teamMembershipId: value(TeamMembershipId.create('0198f334-6dc5-7c20-9af1-91d7e599fe02')),
    organizationId: value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599fe03')),
    ministryId: value(MinistryId.create('0198f334-6dc5-7c20-9af1-91d7e599fe04')),
    ministryTeamId: value(MinistryTeamId.create('0198f334-6dc5-7c20-9af1-91d7e599fe05')),
    ministryMembershipId: value(
      MinistryMembershipId.create('0198f334-6dc5-7c20-9af1-91d7e599fe06'),
    ),
  });
  const mapped = mapMemberAssignedToTeamIntegrationEvent(event);
  assert.equal(mapped.type, 'servir.ministries.member.assigned-to-team.v1');
  assert.equal(mapped.payload.status, 'active');
});
