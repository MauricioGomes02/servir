import type { IntegrationEvent } from '@servir/integration-messaging';
export type MinistryRoleDefinedIntegrationEventV1 = IntegrationEvent<
  'ministry.role_defined',
  1,
  Readonly<{
    ministryId: string;
    organizationId: string;
    ministryRoleId: string;
    name: string;
    status: 'active';
  }>
>;
