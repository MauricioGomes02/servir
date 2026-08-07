import type { OrganizationId } from '@/modules/organizations/domain';
import { failure, success, type Result } from '@/shared/core/result';
import { AggregateRoot } from '@/shared/domain/aggregate-root';
import type { DomainEventId } from '@/shared/domain/domain-event';
import type { Instant } from '@/shared/domain/instant';

import { createMinistryCreated, createMinistryRoleDefined, type MinistryEvent } from '../events';
import {
  MinistryName,
  MinistryRoleName,
  type MinistryNameError,
  type MinistryRoleNameError,
} from '../value-objects';
import type { MinistryId } from './ministry-id';
import { MinistryRole } from './ministry-role';
import type { MinistryRoleId } from './ministry-role-id';
import {
  MinistryRoleDefinitionErrorCodes,
  type MinistryRoleDefinitionError,
} from './ministry-role-definition-error';

export type MinistryStatus = 'active' | 'inactive';

interface MinistryProps {
  readonly organizationId: OrganizationId;
  readonly name: MinistryName;
  readonly status: MinistryStatus;
  readonly roles: MinistryRole[];
}

export interface CreateMinistryProps {
  readonly id: MinistryId;
  readonly organizationId: OrganizationId;
  readonly name: unknown;
  readonly eventId: DomainEventId;
  readonly occurredAt: Instant;
}

export class Ministry extends AggregateRoot<MinistryId, MinistryProps, MinistryEvent> {
  private constructor(id: MinistryId, props: MinistryProps) {
    super(id, props);
  }

  static create(input: CreateMinistryProps): Result<Ministry, MinistryNameError> {
    const name = MinistryName.create(input.name);
    if (!name.success) return failure(name.error);

    const ministry = new Ministry(input.id, {
      organizationId: input.organizationId,
      name: name.value,
      status: 'active',
      roles: [],
    });
    ministry.recordDomainEvent(
      createMinistryCreated({
        eventId: input.eventId,
        occurredAt: input.occurredAt,
        ministryId: input.id,
        organizationId: input.organizationId,
        name: name.value,
      }),
    );
    return success(ministry);
  }

  static reconstitute(input: {
    readonly id: MinistryId;
    readonly organizationId: OrganizationId;
    readonly name: MinistryName;
    readonly status: MinistryStatus;
    readonly roles: ReadonlyArray<MinistryRole>;
  }): Ministry {
    return new Ministry(input.id, {
      organizationId: input.organizationId,
      name: input.name,
      status: input.status,
      roles: [...input.roles],
    });
  }

  defineRole(input: {
    readonly id: MinistryRoleId;
    readonly name: unknown;
    readonly eventId: DomainEventId;
    readonly occurredAt: Instant;
  }): Result<MinistryRole, MinistryRoleNameError | MinistryRoleDefinitionError> {
    const name = MinistryRoleName.create(input.name);
    if (!name.success) return failure(name.error);
    const duplicate = this.props.roles.some(
      (role) =>
        role.status === 'active' &&
        role.name.toString().toLowerCase() === name.value.toString().toLowerCase(),
    );
    if (duplicate)
      return failure({
        code: MinistryRoleDefinitionErrorCodes.ActiveNameAlreadyExists,
        field: 'name',
      });
    const role = MinistryRole.create(input.id, name.value);
    this.props.roles.push(role);
    this.recordDomainEvent(
      createMinistryRoleDefined({
        eventId: input.eventId,
        occurredAt: input.occurredAt,
        ministryId: this.id,
        organizationId: this.organizationId,
        ministryRoleId: role.id,
        name: role.name,
      }),
    );
    return success(role);
  }

  get organizationId(): OrganizationId {
    return this.props.organizationId;
  }
  get name(): MinistryName {
    return this.props.name;
  }
  get status(): MinistryStatus {
    return this.props.status;
  }
  get roles(): ReadonlyArray<MinistryRole> {
    return Object.freeze([...this.props.roles]);
  }
}
