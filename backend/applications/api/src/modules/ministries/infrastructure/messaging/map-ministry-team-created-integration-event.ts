import type { MinistryTeamCreatedIntegrationEventV1 } from '../../application';
import type { MinistryTeamCreated } from '../../domain';
export function mapMinistryTeamCreatedIntegrationEvent(
  event: MinistryTeamCreated,
): MinistryTeamCreatedIntegrationEventV1 {
  return Object.freeze({
    channel: 'servir.ministries.events',
    source: 'urn:servir:ministries',
    type: 'servir.ministries.ministry-team.created.v1',
    name: 'ministry_team.created',
    version: 1,
    occurredAt: event.occurredAt.toISOString(),
    aggregateId: event.payload.ministryTeamId,
    partitionKey: event.payload.organizationId,
    payload: Object.freeze({ ...event.payload, status: 'active' as const }),
    metadata: Object.freeze({}),
  });
}
