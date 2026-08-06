import type { OrganizationId } from '@/modules/organizations/domain';
import { failure, success, type Result } from '@/shared/core/result';
import { AggregateRoot } from '@/shared/domain/aggregate-root';
import type { DomainEventId } from '@/shared/domain/domain-event';
import type { Instant } from '@/shared/domain/instant';

import { createMinistryCreated, type MinistryEvent } from '../events';
import { MinistryName, type MinistryNameError } from '../value-objects';
import type { MinistryId } from './ministry-id';

export type MinistryStatus = 'active' | 'inactive';

interface MinistryProps {
  readonly organizationId: OrganizationId;
  readonly name: MinistryName;
  readonly status: MinistryStatus;
}

export interface CreateMinistryProps {
  readonly id: MinistryId;
  readonly organizationId: OrganizationId;
  readonly name: unknown;
  readonly eventId: DomainEventId;
  readonly occurredAt: Instant;
}

export class Ministry extends AggregateRoot<MinistryId, MinistryProps, MinistryEvent> {
  private constructor(id: MinistryId, props: MinistryProps) { super(id, props); }

  static create(input: CreateMinistryProps): Result<Ministry, MinistryNameError> {
    const name = MinistryName.create(input.name);
    if (!name.success) return failure(name.error);

    const ministry = new Ministry(input.id, {
      organizationId: input.organizationId,
      name: name.value,
      status: 'active',
    });
    ministry.recordDomainEvent(createMinistryCreated({
      eventId: input.eventId,
      occurredAt: input.occurredAt,
      ministryId: input.id,
      organizationId: input.organizationId,
      name: name.value,
    }));
    return success(ministry);
  }

  get organizationId(): OrganizationId { return this.props.organizationId; }
  get name(): MinistryName { return this.props.name; }
  get status(): MinistryStatus { return this.props.status; }
}
