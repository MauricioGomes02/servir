import type { AvailabilityRequestOpenedIntegrationEventV1 } from '../application';
import type { AvailabilityRequestOpened } from '../domain';

export function mapAvailabilityRequestOpenedIntegrationEvent(
  event: AvailabilityRequestOpened,
): AvailabilityRequestOpenedIntegrationEventV1 {
  return Object.freeze({
    channel: 'servir.availability.events',
    source: 'urn:servir:availability',
    type: 'servir.availability.availability-request.opened.v1',
    name: 'availability_request.opened',
    version: 1,
    occurredAt: event.occurredAt.toISOString(),
    aggregateId: event.payload.availabilityRequestId,
    partitionKey: event.payload.organizationId,
    payload: Object.freeze({ ...event.payload }),
    metadata: Object.freeze({}),
  });
}
