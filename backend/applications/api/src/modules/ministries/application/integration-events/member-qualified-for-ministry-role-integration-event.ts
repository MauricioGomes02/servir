import type { IntegrationEvent } from '@servir/integration-messaging';
export type MemberQualifiedForMinistryRoleIntegrationEventV1 = IntegrationEvent<
  'member.qualified_for_ministry_role',
  1,
  Readonly<{
    ministryRoleQualificationId: string;
    ministryMembershipId: string;
    organizationId: string;
    ministryId: string;
    ministryRoleId: string;
    status: 'active';
  }>
>;
