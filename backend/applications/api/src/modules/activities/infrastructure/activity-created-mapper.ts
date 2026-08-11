import type { ActivityCreatedIntegrationEventV1 } from '../application';
import type { ActivityCreated } from '../domain';

export function mapActivityCreatedIntegrationEvent(
  event: ActivityCreated,
): ActivityCreatedIntegrationEventV1 {
  return Object.freeze({
    channel: 'servir.activities.events',
    source: 'urn:servir:activities',
    type: 'servir.activities.activity.created.v1',
    name: 'activity.created',
    version: 1,
    occurredAt: event.occurredAt.toISOString(),
    aggregateId: event.payload.activityId,
    partitionKey: event.payload.organizationId,
    payload: Object.freeze({ ...event.payload, status: 'active' as const }),
    metadata: Object.freeze({}),
  });
}
