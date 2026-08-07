import type { MinistryCreatedIntegrationEventV1 } from '../../application';
import type { MinistryCreated } from '../../domain';

export function mapMinistryCreatedIntegrationEvent(
  event: MinistryCreated,
): MinistryCreatedIntegrationEventV1 {
  return Object.freeze({
    channel: 'servir.ministries.events',
    source: 'urn:servir:ministries',
    type: 'servir.ministries.ministry.created.v1',
    name: 'ministry.created',
    version: 1,
    occurredAt: event.occurredAt.toISOString(),
    aggregateId: event.payload.ministryId,
    partitionKey: event.payload.organizationId,
    payload: Object.freeze({ ...event.payload, status: 'active' as const }),
    metadata: Object.freeze({}),
  });
}
