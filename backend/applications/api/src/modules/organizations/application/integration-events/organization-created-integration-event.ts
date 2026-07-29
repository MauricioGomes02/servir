import type { IntegrationEvent } from '@servir/integration-messaging';

export type OrganizationCreatedIntegrationEventV1 = IntegrationEvent<
  'organization.created',
  1,
  Readonly<{
    organizationId: string;
    name: string;
  }>
>;
