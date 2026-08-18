import type { UserId } from './user-id';
import type { OrganizationId } from '@/modules/organizations/domain';
import { AggregateRoot } from '@/shared/domain/aggregate-root';
import type { OrganizationAccessId } from './organization-access-id';

export const OrganizationAccessRoles = { Owner: 'owner' } as const;
export const OrganizationAccessStatuses = { Active: 'active', Revoked: 'revoked' } as const;
export type OrganizationAccessRole =
  (typeof OrganizationAccessRoles)[keyof typeof OrganizationAccessRoles];
export type OrganizationAccessStatus =
  (typeof OrganizationAccessStatuses)[keyof typeof OrganizationAccessStatuses];

interface OrganizationAccessProps {
  readonly organizationId: OrganizationId;
  readonly role: OrganizationAccessRole;
  readonly status: OrganizationAccessStatus;
  readonly userId: UserId;
}

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
