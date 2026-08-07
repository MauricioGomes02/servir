import type { MemberId } from '@/modules/membership/domain';
import type { OrganizationId } from '@/modules/organizations/domain';
import {
  createDomainEvent,
  type DomainEvent,
  type DomainEventId,
} from '@/shared/domain/domain-event';
import type { Instant } from '@/shared/domain/instant';
import type { MinistryId } from '../entities/ministry-id';
import type { MinistryMembershipId } from '../entities/ministry-membership-id';

export type MinistryMembershipApproved = DomainEvent<
  'ministry_membership.approved',
  Readonly<{
    ministryMembershipId: string;
    organizationId: string;
    ministryId: string;
    memberId: string;
  }>
>;

export function createMinistryMembershipApproved(input: {
  eventId: DomainEventId;
  occurredAt: Instant;
  ministryMembershipId: MinistryMembershipId;
  organizationId: OrganizationId;
  ministryId: MinistryId;
  memberId: MemberId;
}): MinistryMembershipApproved {
  return createDomainEvent({
    eventId: input.eventId,
    name: 'ministry_membership.approved',
    occurredAt: input.occurredAt,
    payload: {
      ministryMembershipId: input.ministryMembershipId.toString(),
      organizationId: input.organizationId.toString(),
      ministryId: input.ministryId.toString(),
      memberId: input.memberId.toString(),
    },
  });
}

export function isMinistryMembershipApproved(
  event: DomainEvent,
): event is MinistryMembershipApproved {
  return event.name === 'ministry_membership.approved';
}
