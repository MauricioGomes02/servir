import type { OrganizationId } from '@/modules/organizations/domain';
import {
  createDomainEvent,
  type DomainEvent,
  type DomainEventId,
} from '@/shared/domain/domain-event';
import type { Instant } from '@/shared/domain/instant';
import type {
  MinistryId,
  MinistryMembershipId,
  MinistryRoleId,
  MinistryRoleQualificationId,
} from '../entities';
export type MemberQualifiedForMinistryRole = DomainEvent<
  'member.qualified_for_ministry_role',
  Readonly<{
    ministryRoleQualificationId: string;
    ministryMembershipId: string;
    organizationId: string;
    ministryId: string;
    ministryRoleId: string;
  }>
>;
export function createMemberQualifiedForMinistryRole(input: {
  eventId: DomainEventId;
  occurredAt: Instant;
  ministryRoleQualificationId: MinistryRoleQualificationId;
  ministryMembershipId: MinistryMembershipId;
  organizationId: OrganizationId;
  ministryId: MinistryId;
  ministryRoleId: MinistryRoleId;
}): MemberQualifiedForMinistryRole {
  return createDomainEvent({
    eventId: input.eventId,
    name: 'member.qualified_for_ministry_role',
    occurredAt: input.occurredAt,
    payload: {
      ministryRoleQualificationId: input.ministryRoleQualificationId.value,
      ministryMembershipId: input.ministryMembershipId.value,
      organizationId: input.organizationId.value,
      ministryId: input.ministryId.value,
      ministryRoleId: input.ministryRoleId.value,
    },
  });
}
export function isMemberQualifiedForMinistryRole(
  event: DomainEvent,
): event is MemberQualifiedForMinistryRole {
  return event.name === 'member.qualified_for_ministry_role';
}
