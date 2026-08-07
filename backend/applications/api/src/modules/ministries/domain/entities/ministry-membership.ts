import type { MemberId } from '@/modules/membership/domain';
import type { OrganizationId } from '@/modules/organizations/domain';
import { failure, success, type Result } from '@/shared/core/result';
import { AggregateRoot } from '@/shared/domain/aggregate-root';
import type { DomainEventId } from '@/shared/domain/domain-event';
import type { Instant } from '@/shared/domain/instant';
import {
  createMinistryMembershipApproved,
  createMinistryMembershipRequested,
  type MinistryMembershipEvent,
} from '../events';
import {
  MinistryMembershipApprovalErrorCodes,
  type MinistryMembershipApprovalError,
} from './ministry-membership-approval-error';
import type { MinistryId } from './ministry-id';
import type { MinistryMembershipId } from './ministry-membership-id';

export type MinistryMembershipStatus = 'requested' | 'active' | 'rejected' | 'suspended' | 'ended';

interface MinistryMembershipProps {
  readonly organizationId: OrganizationId;
  readonly ministryId: MinistryId;
  readonly memberId: MemberId;
  status: MinistryMembershipStatus;
  readonly requestedAt: Instant;
  approvedAt?: Instant;
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

  static reconstitute(input: {
    readonly id: MinistryMembershipId;
    readonly organizationId: OrganizationId;
    readonly ministryId: MinistryId;
    readonly memberId: MemberId;
    readonly status: MinistryMembershipStatus;
    readonly requestedAt: Instant;
    readonly approvedAt?: Instant;
  }): MinistryMembership {
    return new MinistryMembership(input.id, {
      organizationId: input.organizationId,
      ministryId: input.ministryId,
      memberId: input.memberId,
      status: input.status,
      requestedAt: input.requestedAt,
      approvedAt: input.approvedAt,
    });
  }

  approve(input: {
    readonly eventId: DomainEventId;
    readonly occurredAt: Instant;
  }): Result<void, MinistryMembershipApprovalError> {
    if (this.status !== 'requested')
      return failure({
        code: MinistryMembershipApprovalErrorCodes.NotRequested,
        field: 'status',
      });
    this.props.status = 'active';
    this.props.approvedAt = input.occurredAt;
    this.recordDomainEvent(
      createMinistryMembershipApproved({
        eventId: input.eventId,
        occurredAt: input.occurredAt,
        ministryMembershipId: this.id,
        organizationId: this.organizationId,
        ministryId: this.ministryId,
        memberId: this.memberId,
      }),
    );
    return success();
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
  get approvedAt(): Instant | undefined {
    return this.props.approvedAt;
  }
}
