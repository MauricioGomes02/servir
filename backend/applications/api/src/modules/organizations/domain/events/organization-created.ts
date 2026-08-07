import {
  createDomainEvent,
  type DomainEvent,
  type DomainEventId,
} from '@/shared/domain/domain-event';
import type { Instant } from '@/shared/domain/instant';

import type { OrganizationId } from '../entities';
import type { OrganizationName } from '../value-objects';

export type OrganizationCreated = DomainEvent<
  'organization.created',
  Readonly<{
    organizationId: string;
    name: string;
  }>
>;

interface CreateOrganizationCreatedProps {
  readonly eventId: DomainEventId;
  readonly occurredAt: Instant;
  readonly organizationId: OrganizationId;
  readonly name: OrganizationName;
}

export function createOrganizationCreated(
  props: CreateOrganizationCreatedProps,
): OrganizationCreated {
  return createDomainEvent({
    eventId: props.eventId,
    name: 'organization.created',
    occurredAt: props.occurredAt,
    payload: {
      organizationId: props.organizationId.toString(),
      name: props.name.toString(),
    },
  });
}

export function isOrganizationCreated(event: DomainEvent): event is OrganizationCreated {
  return event.name === 'organization.created';
}

export type OrganizationEvent = OrganizationCreated;
