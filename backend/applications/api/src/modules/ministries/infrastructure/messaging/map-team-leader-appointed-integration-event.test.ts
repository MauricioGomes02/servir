import assert from 'node:assert/strict';
import { it } from 'node:test';
import { OrganizationId } from '@/modules/organizations/domain';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';
import {
  createTeamLeaderAppointed,
  MinistryId,
  MinistryTeamId,
  TeamLeadershipId,
  TeamMembershipId,
} from '../../domain';
import { mapTeamLeaderAppointedIntegrationEvent } from './map-team-leader-appointed-integration-event';

function value<T>(result: { success: true; value: T } | { success: false }): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('Invalid fixture');
  return result.value;
}

it('maps a leader appointment to the versioned public contract', () => {
  const event = createTeamLeaderAppointed({
    eventId: value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599fa01')),
    occurredAt: value(Instant.create('2026-08-11T12:00:00.000Z')),
    teamLeadershipId: value(TeamLeadershipId.create('0198f334-6dc5-7c20-9af1-91d7e599fa02')),
    organizationId: value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599fa03')),
    ministryId: value(MinistryId.create('0198f334-6dc5-7c20-9af1-91d7e599fa04')),
    ministryTeamId: value(MinistryTeamId.create('0198f334-6dc5-7c20-9af1-91d7e599fa05')),
    teamMembershipId: value(TeamMembershipId.create('0198f334-6dc5-7c20-9af1-91d7e599fa06')),
  });
  const mapped = mapTeamLeaderAppointedIntegrationEvent(event);
  assert.equal(mapped.type, 'servir.ministries.team-leader.appointed.v1');
  assert.equal(mapped.payload.status, 'active');
});
