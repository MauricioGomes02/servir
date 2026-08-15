import { AggregateRoot } from '@/shared/domain/aggregate-root';

import type { ExternalIdentity } from './external-identity';
import type { UserId } from './user-id';

export const UserStatuses = {
  Active: 'active',
  Inactive: 'inactive',
} as const;

export type UserStatus = (typeof UserStatuses)[keyof typeof UserStatuses];

interface UserProps {
  readonly externalIdentities: readonly [ExternalIdentity, ...ExternalIdentity[]];
  readonly status: UserStatus;
}

export class User extends AggregateRoot<UserId, UserProps> {
  private constructor(id: UserId, props: UserProps) {
    super(id, props);
  }

  static provision(id: UserId, externalIdentity: ExternalIdentity): User {
    return new User(id, {
      externalIdentities: Object.freeze([externalIdentity]),
      status: UserStatuses.Active,
    } as const);
  }

  static reconstitute(input: {
    readonly id: UserId;
    readonly externalIdentities: readonly [ExternalIdentity, ...ExternalIdentity[]];
    readonly status: UserStatus;
  }): User {
    return new User(input.id, {
      externalIdentities: Object.freeze([...input.externalIdentities]),
      status: input.status,
    } as const);
  }

  get externalIdentities(): readonly [ExternalIdentity, ...ExternalIdentity[]] {
    return this.props.externalIdentities;
  }

  get status(): UserStatus {
    return this.props.status;
  }
}
