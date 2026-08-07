import {
  createDomainEvent,
  type DomainEvent,
  type DomainEventId,
} from '@/shared/domain/domain-event';
import type { Instant } from '@/shared/domain/instant';
import type { OrganizationId } from '@/modules/organizations/domain';

import type { MinistryId } from '../entities';
import type { MinistryName } from '../value-objects';

export type MinistryCreated = DomainEvent<
  'ministry.created',
  Readonly<{
    ministryId: string;
    organizationId: string;
    name: string;
  }>
>;

interface CreateMinistryCreatedProps {
  readonly eventId: DomainEventId;
  readonly occurredAt: Instant;
  readonly ministryId: MinistryId;
  readonly organizationId: OrganizationId;
  readonly name: MinistryName;
}

export function createMinistryCreated(props: CreateMinistryCreatedProps): MinistryCreated {
  return createDomainEvent({
    eventId: props.eventId,
    name: 'ministry.created',
    occurredAt: props.occurredAt,
    payload: {
      ministryId: props.ministryId.toString(),
      organizationId: props.organizationId.toString(),
      name: props.name.toString(),
    },
  });
}

export function isMinistryCreated(event: DomainEvent): event is MinistryCreated {
  return event.name === 'ministry.created';
}

import type { MinistryRoleDefined } from './ministry-role-defined';
export type MinistryEvent = MinistryCreated | MinistryRoleDefined;
