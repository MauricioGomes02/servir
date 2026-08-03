import type { OrganizationId } from '@/modules/organizations/domain';
import {
  createDomainEvent,
  type DomainEvent,
  type DomainEventId,
} from '@/shared/domain/domain-event';
import type { Instant } from '@/shared/domain/instant';

import type { MemberId } from '../entities';
import type { MemberName } from '../value-objects';

export type MemberRegistered = DomainEvent<
  'member.registered',
  Readonly<{
    memberId: string;
    organizationId: string;
    name: string;
  }>
>;

interface CreateMemberRegisteredProps {
  readonly eventId: DomainEventId;
  readonly occurredAt: Instant;
  readonly memberId: MemberId;
  readonly organizationId: OrganizationId;
  readonly name: MemberName;
}

export function createMemberRegistered(
  props: CreateMemberRegisteredProps,
): MemberRegistered {
  return createDomainEvent({
    eventId: props.eventId,
    name: 'member.registered',
    occurredAt: props.occurredAt,
    payload: {
      memberId: props.memberId.toString(),
      organizationId: props.organizationId.toString(),
      name: props.name.toString(),
    },
  });
}

export function isMemberRegistered(
  event: DomainEvent,
): event is MemberRegistered {
  return event.name === 'member.registered';
}

export type MemberEvent = MemberRegistered;
