import type { IntegrationEvent } from '@servir/integration-messaging';
export type MinistryTeamCreatedIntegrationEventV1 = IntegrationEvent<
  'ministry_team.created',
  1,
  Readonly<{
    ministryTeamId: string;
    organizationId: string;
    ministryId: string;
    name: string;
    status: 'active';
  }>
>;
