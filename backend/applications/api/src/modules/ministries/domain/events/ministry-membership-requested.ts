import {
  createDomainEvent,
  type DomainEvent,
  type DomainEventId,
} from '@/shared/domain/domain-event';
import type { Instant } from '@/shared/domain/instant';
import type { MemberId } from '@/modules/membership/domain';
import type { OrganizationId } from '@/modules/organizations/domain';
import type { MinistryId } from '../entities/ministry-id';
import type { MinistryMembershipId } from '../entities/ministry-membership-id';

export type MinistryMembershipRequested = DomainEvent<
  'ministry_membership.requested',
  Readonly<{
    ministryMembershipId: string;
    organizationId: string;
    ministryId: string;
    memberId: string;
  }>
>;
export type MinistryMembershipEvent = MinistryMembershipRequested;

export function createMinistryMembershipRequested(input: {
  eventId: DomainEventId;
  occurredAt: Instant;
  ministryMembershipId: MinistryMembershipId;
  organizationId: OrganizationId;
  ministryId: MinistryId;
  memberId: MemberId;
}): MinistryMembershipRequested {
  return createDomainEvent({
    eventId: input.eventId,
    name: 'ministry_membership.requested',
    occurredAt: input.occurredAt,
    payload: {
      ministryMembershipId: input.ministryMembershipId.toString(),
      organizationId: input.organizationId.toString(),
      ministryId: input.ministryId.toString(),
      memberId: input.memberId.toString(),
    },
  });
}

export function isMinistryMembershipRequested(
  event: DomainEvent,
): event is MinistryMembershipRequested {
  return event.name === 'ministry_membership.requested';
}
