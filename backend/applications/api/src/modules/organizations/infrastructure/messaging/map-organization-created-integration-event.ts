import type { OrganizationCreatedIntegrationEventV1 } from '@/modules/organizations/application';
import type { OrganizationCreated } from '@/modules/organizations/domain';

export function mapOrganizationCreatedIntegrationEvent(
  event: OrganizationCreated,
): OrganizationCreatedIntegrationEventV1 {
  return Object.freeze({
    channel: 'servir.organizations.events',
    source: 'urn:servir:organizations',
    type: 'servir.organizations.organization.created.v1',
    name: 'organization.created',
    version: 1,
    occurredAt: event.occurredAt.toISOString(),
    aggregateId: event.payload.organizationId,
    partitionKey: event.payload.organizationId,
    payload: Object.freeze({
      organizationId: event.payload.organizationId,
      name: event.payload.name,
    }),
    metadata: Object.freeze({}),
  });
}
