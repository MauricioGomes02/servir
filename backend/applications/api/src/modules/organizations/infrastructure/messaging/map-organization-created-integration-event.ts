import type { OrganizationCreatedIntegrationEventV1 } from '@/modules/organizations/application';
import type { OrganizationCreated } from '@/modules/organizations/domain';

export function mapOrganizationCreatedIntegrationEvent(
  event: OrganizationCreated,
): OrganizationCreatedIntegrationEventV1 {
  return Object.freeze({
    name: 'organization.created',
    version: 1,
    occurredAt: event.occurredAt,
    aggregateId: event.payload.organizationId,
    partitionKey: event.payload.organizationId,
    payload: Object.freeze({
      organizationId: event.payload.organizationId,
      name: event.payload.name,
    }),
    metadata: Object.freeze({}),
  });
}
