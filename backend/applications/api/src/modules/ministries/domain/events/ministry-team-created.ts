import type { OrganizationId } from '@/modules/organizations/domain';
import {
  createDomainEvent,
  type DomainEvent,
  type DomainEventId,
} from '@/shared/domain/domain-event';
import type { Instant } from '@/shared/domain/instant';
import type { MinistryId, MinistryTeamId } from '../entities';
import type { MinistryTeamName } from '../value-objects';
export type MinistryTeamCreated = DomainEvent<
  'ministry_team.created',
  Readonly<{ ministryTeamId: string; organizationId: string; ministryId: string; name: string }>
>;
export function createMinistryTeamCreated(input: {
  eventId: DomainEventId;
  occurredAt: Instant;
  ministryTeamId: MinistryTeamId;
  organizationId: OrganizationId;
  ministryId: MinistryId;
  name: MinistryTeamName;
}): MinistryTeamCreated {
  return createDomainEvent({
    eventId: input.eventId,
    name: 'ministry_team.created',
    occurredAt: input.occurredAt,
    payload: {
      ministryTeamId: input.ministryTeamId.value,
      organizationId: input.organizationId.value,
      ministryId: input.ministryId.value,
      name: input.name.toString(),
    },
  });
}
export function isMinistryTeamCreated(event: DomainEvent): event is MinistryTeamCreated {
  return event.name === 'ministry_team.created';
}
