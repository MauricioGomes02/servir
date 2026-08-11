import type { IntegrationEvent } from '@servir/integration-messaging';

export type TeamLeaderAppointedIntegrationEventV1 = IntegrationEvent<
  'team_leader.appointed',
  1,
  Readonly<{
    teamLeadershipId: string;
    organizationId: string;
    ministryId: string;
    ministryTeamId: string;
    teamMembershipId: string;
    status: 'active';
    appointedAt: string;
  }>
>;
