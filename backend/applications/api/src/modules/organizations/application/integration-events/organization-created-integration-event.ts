import type { IntegrationEvent } from '@/shared/application/messaging';

export type OrganizationCreatedIntegrationEventV1 = IntegrationEvent<
  'organization.created',
  1,
  Readonly<{
    organizationId: string;
    name: string;
  }>
>;
