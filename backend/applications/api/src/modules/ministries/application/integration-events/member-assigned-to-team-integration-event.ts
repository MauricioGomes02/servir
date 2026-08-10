import type { IntegrationEvent } from '@servir/integration-messaging';
export type MemberAssignedToTeamIntegrationEventV1 = IntegrationEvent<
  'member.assigned_to_team',
  1,
  Readonly<{
    teamMembershipId: string;
    organizationId: string;
    ministryId: string;
    ministryTeamId: string;
    ministryMembershipId: string;
    status: 'active';
    assignedAt: string;
  }>
>;
