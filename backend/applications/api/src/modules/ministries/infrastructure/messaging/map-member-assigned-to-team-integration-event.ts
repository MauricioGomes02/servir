import type { MemberAssignedToTeamIntegrationEventV1 } from '../../application';
import type { MemberAssignedToTeam } from '../../domain';
export function mapMemberAssignedToTeamIntegrationEvent(
  event: MemberAssignedToTeam,
): MemberAssignedToTeamIntegrationEventV1 {
  return Object.freeze({
    channel: 'servir.ministries.events',
    source: 'urn:servir:ministries',
    type: 'servir.ministries.member.assigned-to-team.v1',
    name: 'member.assigned_to_team',
    version: 1,
    occurredAt: event.occurredAt.toISOString(),
    aggregateId: event.payload.teamMembershipId,
    partitionKey: event.payload.organizationId,
    payload: Object.freeze({
      ...event.payload,
      status: 'active' as const,
      assignedAt: event.occurredAt.toISOString(),
    }),
    metadata: Object.freeze({}),
  });
}
