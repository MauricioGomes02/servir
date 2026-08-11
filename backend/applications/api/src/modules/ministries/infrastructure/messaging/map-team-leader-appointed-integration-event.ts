import type { TeamLeaderAppointedIntegrationEventV1 } from '../../application';
import type { TeamLeaderAppointed } from '../../domain';

export function mapTeamLeaderAppointedIntegrationEvent(
  event: TeamLeaderAppointed,
): TeamLeaderAppointedIntegrationEventV1 {
  return Object.freeze({
    channel: 'servir.ministries.events',
    source: 'urn:servir:ministries',
    type: 'servir.ministries.team-leader.appointed.v1',
    name: 'team_leader.appointed',
    version: 1,
    occurredAt: event.occurredAt.toISOString(),
    aggregateId: event.payload.teamLeadershipId,
    partitionKey: event.payload.organizationId,
    payload: Object.freeze({
      ...event.payload,
      status: 'active' as const,
      appointedAt: event.occurredAt.toISOString(),
    }),
    metadata: Object.freeze({}),
  });
}
