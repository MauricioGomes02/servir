import { failure, success, type Result } from '@/shared/core/result';
import { AggregateRoot } from '@/shared/domain/aggregate-root';
import type { DomainEventId } from '@/shared/domain/domain-event';
import type { Instant } from '@/shared/domain/instant';

import { createOrganizationCreated, type OrganizationEvent } from '../events';
import { OrganizationName, type OrganizationNameError } from '../value-objects';
import type { OrganizationId } from './organization-id';

interface OrganizationProps {
  name: OrganizationName;
}

export interface CreateOrganizationProps {
  readonly id: OrganizationId;
  readonly name: unknown;
  readonly eventId: DomainEventId;
  readonly occurredAt: Instant;
}

export class Organization extends AggregateRoot<
  OrganizationId,
  OrganizationProps,
  OrganizationEvent
> {
  private constructor(id: OrganizationId, props: OrganizationProps) {
    super(id, props);
  }

  static create(input: CreateOrganizationProps): Result<Organization, OrganizationNameError> {
    const name = OrganizationName.create(input.name);

    if (!name.success) {
      return failure(name.error);
    }

    const organization = new Organization(input.id, {
      name: name.value,
    });

    organization.recordDomainEvent(
      createOrganizationCreated({
        eventId: input.eventId,
        occurredAt: input.occurredAt,
        organizationId: input.id,
        name: name.value,
      }),
    );

    return success(organization);
  }

  get name(): OrganizationName {
    return this.props.name;
  }
}
