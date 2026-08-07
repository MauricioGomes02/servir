import type { IntegrationEvent } from '@servir/integration-messaging';

export type MinistryMembershipRequestedIntegrationEventV1 = IntegrationEvent<
  'ministry_membership.requested',
  1,
  Readonly<{
    ministryMembershipId: string;
    organizationId: string;
    ministryId: string;
    memberId: string;
    status: 'requested';
  }>
>;
