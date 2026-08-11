import type { ActivityOccurrenceScheduledIntegrationEventV1 } from '../application';
import type { ActivityOccurrenceScheduled } from '../domain';

export function mapActivityOccurrenceScheduledIntegrationEvent(
  event: ActivityOccurrenceScheduled,
): ActivityOccurrenceScheduledIntegrationEventV1 {
  return Object.freeze({
    channel: 'servir.activities.events',
    source: 'urn:servir:activities',
    type: 'servir.activities.activity-occurrence.scheduled.v1',
    name: 'activity_occurrence.scheduled',
    version: 1,
    occurredAt: event.occurredAt.toISOString(),
    aggregateId: event.payload.activityOccurrenceId,
    partitionKey: event.payload.organizationId,
    payload: Object.freeze({ ...event.payload, status: 'scheduled' as const }),
    metadata: Object.freeze({}),
  });
}
