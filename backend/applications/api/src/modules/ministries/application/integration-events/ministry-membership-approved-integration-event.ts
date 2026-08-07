import type { IntegrationEvent } from '@servir/integration-messaging';
export type MinistryMembershipApprovedIntegrationEventV1 = IntegrationEvent<
  'ministry_membership.approved',
  1,
  Readonly<{
    ministryMembershipId: string;
    organizationId: string;
    ministryId: string;
    memberId: string;
    status: 'active';
  }>
>;
