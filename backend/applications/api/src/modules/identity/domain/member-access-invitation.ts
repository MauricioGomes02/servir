import type { MemberId } from '@/modules/membership/domain';
import type { OrganizationId } from '@/modules/organizations/domain';
import { failure, success, type Result } from '@/shared/core/result';
import { AggregateRoot } from '@/shared/domain/aggregate-root';
import type { Instant } from '@/shared/domain/instant';

import type { MemberAccessInvitationId } from './member-access-invitation-id';
import type { MemberAccessInvitationTokenDigest } from './member-access-invitation-token-digest';

export const MemberAccessInvitationStatuses = {
  Pending: 'pending',
  Accepted: 'accepted',
  Revoked: 'revoked',
} as const;

export type MemberAccessInvitationStatus =
  (typeof MemberAccessInvitationStatuses)[keyof typeof MemberAccessInvitationStatuses];

export const MemberAccessInvitationErrorCodes = {
  AlreadyConsumed: 'identity.member_access_invitation.already_consumed',
  ExpirationInvalid: 'identity.member_access_invitation.expiration_invalid',
  Expired: 'identity.member_access_invitation.expired',
  Revoked: 'identity.member_access_invitation.revoked',
} as const;

export type MemberAccessInvitationCreationError = Readonly<{
  code: typeof MemberAccessInvitationErrorCodes.ExpirationInvalid;
  field: 'expiresAt';
}>;

export type MemberAccessInvitationLifecycleError = Readonly<{
  code:
    | typeof MemberAccessInvitationErrorCodes.AlreadyConsumed
    | typeof MemberAccessInvitationErrorCodes.Expired
    | typeof MemberAccessInvitationErrorCodes.Revoked;
}>;

interface MemberAccessInvitationProps {
  readonly expiresAt: Instant;
  readonly memberId: MemberId;
  readonly organizationId: OrganizationId;
  readonly status: MemberAccessInvitationStatus;
  readonly tokenDigest: MemberAccessInvitationTokenDigest;
}

export class MemberAccessInvitation extends AggregateRoot<
  MemberAccessInvitationId,
  MemberAccessInvitationProps,
  never
> {
  private constructor(id: MemberAccessInvitationId, props: MemberAccessInvitationProps) {
    super(id, props);
  }

  static invite(input: {
    readonly expiresAt: Instant;
    readonly id: MemberAccessInvitationId;
    readonly memberId: MemberId;
    readonly now: Instant;
    readonly organizationId: OrganizationId;
    readonly tokenDigest: MemberAccessInvitationTokenDigest;
  }): Result<MemberAccessInvitation, MemberAccessInvitationCreationError> {
    if (input.expiresAt.toEpochMilliseconds() <= input.now.toEpochMilliseconds()) {
      return failure({
        code: MemberAccessInvitationErrorCodes.ExpirationInvalid,
        field: 'expiresAt',
      });
    }
    return success(
      new MemberAccessInvitation(input.id, {
        expiresAt: input.expiresAt,
        memberId: input.memberId,
        organizationId: input.organizationId,
        status: MemberAccessInvitationStatuses.Pending,
        tokenDigest: input.tokenDigest,
      }),
    );
  }

  static reconstitute(input: {
    readonly expiresAt: Instant;
    readonly id: MemberAccessInvitationId;
    readonly memberId: MemberId;
    readonly organizationId: OrganizationId;
    readonly status: MemberAccessInvitationStatus;
    readonly tokenDigest: MemberAccessInvitationTokenDigest;
  }): MemberAccessInvitation {
    return new MemberAccessInvitation(input.id, {
      expiresAt: input.expiresAt,
      memberId: input.memberId,
      organizationId: input.organizationId,
      status: input.status,
      tokenDigest: input.tokenDigest,
    });
  }

  accept(now: Instant): Result<void, MemberAccessInvitationLifecycleError> {
    if (this.status === MemberAccessInvitationStatuses.Accepted) {
      return failure({ code: MemberAccessInvitationErrorCodes.AlreadyConsumed });
    }
    if (this.status === MemberAccessInvitationStatuses.Revoked) {
      return failure({ code: MemberAccessInvitationErrorCodes.Revoked });
    }
    if (now.toEpochMilliseconds() >= this.expiresAt.toEpochMilliseconds()) {
      return failure({ code: MemberAccessInvitationErrorCodes.Expired });
    }
    this.props = { ...this.props, status: MemberAccessInvitationStatuses.Accepted };
    return success(undefined);
  }

  revoke(): Result<void, MemberAccessInvitationLifecycleError> {
    if (this.status === MemberAccessInvitationStatuses.Accepted) {
      return failure({ code: MemberAccessInvitationErrorCodes.AlreadyConsumed });
    }
    if (this.status === MemberAccessInvitationStatuses.Revoked) {
      return failure({ code: MemberAccessInvitationErrorCodes.Revoked });
    }
    this.props = { ...this.props, status: MemberAccessInvitationStatuses.Revoked };
    return success(undefined);
  }

  get expiresAt(): Instant {
    return this.props.expiresAt;
  }
  get memberId(): MemberId {
    return this.props.memberId;
  }
  get organizationId(): OrganizationId {
    return this.props.organizationId;
  }
  get status(): MemberAccessInvitationStatus {
    return this.props.status;
  }
  get tokenDigest(): MemberAccessInvitationTokenDigest {
    return this.props.tokenDigest;
  }
}
