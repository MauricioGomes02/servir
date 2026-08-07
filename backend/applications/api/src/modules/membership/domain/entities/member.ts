import { failure, success, type Result } from '@/shared/core/result';
import { AggregateRoot } from '@/shared/domain/aggregate-root';
import type { DomainEventId } from '@/shared/domain/domain-event';
import type { Instant } from '@/shared/domain/instant';
import type { OrganizationId } from '@/modules/organizations/domain';

import { createMemberRegistered, type MemberEvent } from '../events';
import { MemberName, type MemberNameError } from '../value-objects';
import type { MemberId } from './member-id';

export type MemberStatus = 'active' | 'inactive';

interface MemberProps {
  readonly organizationId: OrganizationId;
  readonly name: MemberName;
  readonly status: MemberStatus;
  readonly registeredAt: Instant;
}

export interface RegisterMemberProps {
  readonly id: MemberId;
  readonly organizationId: OrganizationId;
  readonly name: unknown;
  readonly eventId: DomainEventId;
  readonly registeredAt: Instant;
}

export class Member extends AggregateRoot<MemberId, MemberProps, MemberEvent> {
  private constructor(id: MemberId, props: MemberProps) {
    super(id, props);
  }

  static register(input: RegisterMemberProps): Result<Member, MemberNameError> {
    const name = MemberName.create(input.name);

    if (!name.success) {
      return failure(name.error);
    }

    const member = new Member(input.id, {
      organizationId: input.organizationId,
      name: name.value,
      status: 'active',
      registeredAt: input.registeredAt,
    });

    member.recordDomainEvent(
      createMemberRegistered({
        eventId: input.eventId,
        occurredAt: input.registeredAt,
        memberId: input.id,
        organizationId: input.organizationId,
        name: name.value,
      }),
    );

    return success(member);
  }

  get organizationId(): OrganizationId {
    return this.props.organizationId;
  }

  get name(): MemberName {
    return this.props.name;
  }

  get status(): MemberStatus {
    return this.props.status;
  }

  get registeredAt(): Instant {
    return this.props.registeredAt;
  }
}
