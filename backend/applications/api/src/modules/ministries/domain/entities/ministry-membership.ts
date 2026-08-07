import type { MemberId } from '@/modules/membership/domain';
import type { OrganizationId } from '@/modules/organizations/domain';
import { AggregateRoot } from '@/shared/domain/aggregate-root';
import type { DomainEventId } from '@/shared/domain/domain-event';
import type { Instant } from '@/shared/domain/instant';
import { createMinistryMembershipRequested, type MinistryMembershipEvent } from '../events';
import type { MinistryId } from './ministry-id';
import type { MinistryMembershipId } from './ministry-membership-id';

export type MinistryMembershipStatus = 'requested' | 'active' | 'rejected' | 'suspended' | 'ended';

interface MinistryMembershipProps {
  readonly organizationId: OrganizationId;
  readonly ministryId: MinistryId;
  readonly memberId: MemberId;
  readonly status: MinistryMembershipStatus;
  readonly requestedAt: Instant;
}

export interface RequestMinistryMembershipProps {
  readonly id: MinistryMembershipId;
  readonly organizationId: OrganizationId;
  readonly ministryId: MinistryId;
  readonly memberId: MemberId;
  readonly eventId: DomainEventId;
  readonly requestedAt: Instant;
}

export class MinistryMembership extends AggregateRoot<
  MinistryMembershipId,
  MinistryMembershipProps,
  MinistryMembershipEvent
> {
  private constructor(id: MinistryMembershipId, props: MinistryMembershipProps) {
    super(id, props);
  }

  static request(input: RequestMinistryMembershipProps): MinistryMembership {
    const membership = new MinistryMembership(input.id, {
      organizationId: input.organizationId,
      ministryId: input.ministryId,
      memberId: input.memberId,
      status: 'requested',
      requestedAt: input.requestedAt,
    });
    membership.recordDomainEvent(
      createMinistryMembershipRequested({
        eventId: input.eventId,
        occurredAt: input.requestedAt,
        ministryMembershipId: input.id,
        organizationId: input.organizationId,
        ministryId: input.ministryId,
        memberId: input.memberId,
      }),
    );
    return membership;
  }

  get organizationId(): OrganizationId {
    return this.props.organizationId;
  }
  get ministryId(): MinistryId {
    return this.props.ministryId;
  }
  get memberId(): MemberId {
    return this.props.memberId;
  }
  get status(): MinistryMembershipStatus {
    return this.props.status;
  }
  get requestedAt(): Instant {
    return this.props.requestedAt;
  }
}
