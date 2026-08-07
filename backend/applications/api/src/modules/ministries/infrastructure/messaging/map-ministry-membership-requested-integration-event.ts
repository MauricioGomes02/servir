import type { MinistryMembershipRequestedIntegrationEventV1 } from '../../application';
import type { MinistryMembershipRequested } from '../../domain';

export function mapMinistryMembershipRequestedIntegrationEvent(
  event: MinistryMembershipRequested,
): MinistryMembershipRequestedIntegrationEventV1 {
  return Object.freeze({
    channel: 'servir.ministries.events',
    source: 'urn:servir:ministries',
    type: 'servir.ministries.ministry-membership.requested.v1',
    name: 'ministry_membership.requested',
    version: 1,
    occurredAt: event.occurredAt.toISOString(),
    aggregateId: event.payload.ministryMembershipId,
    partitionKey: event.payload.organizationId,
    payload: Object.freeze({ ...event.payload, status: 'requested' as const }),
    metadata: Object.freeze({}),
  });
}
