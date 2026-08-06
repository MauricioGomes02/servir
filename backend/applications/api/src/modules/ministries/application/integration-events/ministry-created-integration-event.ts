import type { IntegrationEvent } from '@servir/integration-messaging';

export type MinistryCreatedIntegrationEventV1 = IntegrationEvent<
  'ministry.created', 1, Readonly<{
    ministryId: string;
    organizationId: string;
    name: string;
    status: 'active';
  }>
>;
