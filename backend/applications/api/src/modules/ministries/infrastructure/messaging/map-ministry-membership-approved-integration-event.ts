import type { MinistryMembershipApprovedIntegrationEventV1 } from '../../application';
import type { MinistryMembershipApproved } from '../../domain';
export function mapMinistryMembershipApprovedIntegrationEvent(
  event: MinistryMembershipApproved,
): MinistryMembershipApprovedIntegrationEventV1 {
  return Object.freeze({
    channel: 'servir.ministries.events',
    source: 'urn:servir:ministries',
    type: 'servir.ministries.ministry-membership.approved.v1',
    name: 'ministry_membership.approved',
    version: 1,
    occurredAt: event.occurredAt.toISOString(),
    aggregateId: event.payload.ministryMembershipId,
    partitionKey: event.payload.organizationId,
    payload: Object.freeze({ ...event.payload, status: 'active' as const }),
    metadata: Object.freeze({}),
  });
}
