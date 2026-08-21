import type { UserId } from './user-id';
import type { MemberId } from '@/modules/membership/domain';
import type { OrganizationId } from '@/modules/organizations/domain';
import { failure, success, type Result } from '@/shared/core/result';
import { AggregateRoot } from '@/shared/domain/aggregate-root';
import type { OrganizationAccessId } from './organization-access-id';

export const OrganizationAccessRoles = { Owner: 'owner' } as const;
export const OrganizationAccessStatuses = { Active: 'active', Revoked: 'revoked' } as const;
export type OrganizationAccessRole =
  (typeof OrganizationAccessRoles)[keyof typeof OrganizationAccessRoles];
export type OrganizationAccessStatus =
  (typeof OrganizationAccessStatuses)[keyof typeof OrganizationAccessStatuses];

interface OrganizationAccessProps {
  readonly memberId?: MemberId;
  readonly organizationId: OrganizationId;
  readonly role: OrganizationAccessRole;
  readonly status: OrganizationAccessStatus;
  readonly userId: UserId;
}

export const OrganizationAccessLinkErrorCodes = {
  DifferentOrganization: 'identity.organization_access.member_different_organization',
  InactiveAccess: 'identity.organization_access.inactive',
  UserAlreadyLinkedToAnotherMember:
    'identity.organization_access.user_already_linked_to_another_member',
} as const;

export type OrganizationAccessLinkError = Readonly<{
  code: (typeof OrganizationAccessLinkErrorCodes)[keyof typeof OrganizationAccessLinkErrorCodes];
}>;

export class OrganizationAccess extends AggregateRoot<
  OrganizationAccessId,
  OrganizationAccessProps,
  never
> {
  private constructor(id: OrganizationAccessId, props: OrganizationAccessProps) {
    super(id, props);
  }

  static grantOwner(input: {
    readonly id: OrganizationAccessId;
    readonly organizationId: OrganizationId;
    readonly userId: UserId;
  }): OrganizationAccess {
    return new OrganizationAccess(input.id, {
      organizationId: input.organizationId,
      role: OrganizationAccessRoles.Owner,
      status: OrganizationAccessStatuses.Active,
      userId: input.userId,
    });
  }

  static reconstitute(input: {
    readonly id: OrganizationAccessId;
    readonly memberId?: MemberId;
    readonly organizationId: OrganizationId;
    readonly role: OrganizationAccessRole;
    readonly status: OrganizationAccessStatus;
    readonly userId: UserId;
  }): OrganizationAccess {
    return new OrganizationAccess(input.id, {
      ...(input.memberId === undefined ? {} : { memberId: input.memberId }),
      organizationId: input.organizationId,
      role: input.role,
      status: input.status,
      userId: input.userId,
    });
  }

  linkMember(input: {
    readonly memberId: MemberId;
    readonly organizationId: OrganizationId;
  }): Result<void, OrganizationAccessLinkError> {
    if (this.status !== OrganizationAccessStatuses.Active) {
      return failure({ code: OrganizationAccessLinkErrorCodes.InactiveAccess });
    }
    if (!this.organizationId.equals(input.organizationId)) {
      return failure({ code: OrganizationAccessLinkErrorCodes.DifferentOrganization });
    }
    if (this.memberId !== undefined && !this.memberId.equals(input.memberId)) {
      return failure({
        code: OrganizationAccessLinkErrorCodes.UserAlreadyLinkedToAnotherMember,
      });
    }
    if (this.memberId === undefined) {
      this.props = { ...this.props, memberId: input.memberId };
    }
    return success(undefined);
  }

  get memberId(): MemberId | undefined {
    return this.props.memberId;
  }

  get organizationId(): OrganizationId {
    return this.props.organizationId;
  }
  get role(): OrganizationAccessRole {
    return this.props.role;
  }
  get status(): OrganizationAccessStatus {
    return this.props.status;
  }
  get userId(): UserId {
    return this.props.userId;
  }
}
