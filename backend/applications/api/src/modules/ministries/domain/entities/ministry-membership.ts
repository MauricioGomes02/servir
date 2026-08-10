import type { MemberId } from '@/modules/membership/domain';
import type { OrganizationId } from '@/modules/organizations/domain';
import { failure, success, type Result } from '@/shared/core/result';
import { AggregateRoot } from '@/shared/domain/aggregate-root';
import type { DomainEventId } from '@/shared/domain/domain-event';
import type { Instant } from '@/shared/domain/instant';
import {
  createMinistryMembershipApproved,
  createMinistryMembershipRequested,
  createMemberQualifiedForMinistryRole,
  type MinistryMembershipEvent,
} from '../events';
import {
  MinistryMembershipApprovalErrorCodes,
  type MinistryMembershipApprovalError,
} from './ministry-membership-approval-error';
import type { MinistryId } from './ministry-id';
import type { MinistryMembershipId } from './ministry-membership-id';
import { MinistryRoleQualification } from './ministry-role-qualification';
import {
  MinistryRoleQualificationErrorCodes,
  type MinistryRoleQualificationError,
} from './ministry-role-qualification-error';
import type { MinistryRoleQualificationId } from './ministry-role-qualification-id';
import type { MinistryRoleId } from './ministry-role-id';

export type MinistryMembershipStatus = 'requested' | 'active' | 'rejected' | 'suspended' | 'ended';

interface MinistryMembershipProps {
  readonly organizationId: OrganizationId;
  readonly ministryId: MinistryId;
  readonly memberId: MemberId;
  status: MinistryMembershipStatus;
  readonly requestedAt: Instant;
  approvedAt?: Instant;
  readonly roleQualifications: MinistryRoleQualification[];
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
      roleQualifications: [],
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
    readonly roleQualifications?: readonly MinistryRoleQualification[];
  }): MinistryMembership {
    return new MinistryMembership(input.id, {
      organizationId: input.organizationId,
      ministryId: input.ministryId,
      memberId: input.memberId,
      status: input.status,
      requestedAt: input.requestedAt,
      approvedAt: input.approvedAt,
      roleQualifications: [...(input.roleQualifications ?? [])],
    });
  }

  qualifyForRole(input: {
    readonly id: MinistryRoleQualificationId;
    readonly ministryRoleId: MinistryRoleId;
    readonly eventId: DomainEventId;
    readonly occurredAt: Instant;
  }): Result<MinistryRoleQualification, MinistryRoleQualificationError> {
    if (this.status !== 'active')
      return failure({
        code: MinistryRoleQualificationErrorCodes.MembershipNotActive,
        field: 'ministryMembershipId',
      });
    if (
      this.props.roleQualifications.some(
        (item) => item.ministryRoleId.equals(input.ministryRoleId) && item.status === 'active',
      )
    )
      return failure({
        code: MinistryRoleQualificationErrorCodes.ActiveQualificationAlreadyExists,
        field: 'ministryRoleId',
      });
    const qualification = MinistryRoleQualification.create(
      input.id,
      input.ministryRoleId,
      input.occurredAt,
    );
    this.props.roleQualifications.push(qualification);
    this.recordDomainEvent(
      createMemberQualifiedForMinistryRole({
        ...input,
        ministryRoleQualificationId: input.id,
        ministryMembershipId: this.id,
        organizationId: this.organizationId,
        ministryId: this.ministryId,
      }),
    );
    return success(qualification);
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
  get roleQualifications(): readonly MinistryRoleQualification[] {
    return Object.freeze([...this.props.roleQualifications]);
  }
}
