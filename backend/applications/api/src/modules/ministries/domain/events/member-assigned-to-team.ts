import type { OrganizationId } from '@/modules/organizations/domain';
import {
  createDomainEvent,
  type DomainEvent,
  type DomainEventId,
} from '@/shared/domain/domain-event';
import type { Instant } from '@/shared/domain/instant';
import type {
  MinistryId,
  MinistryMembershipId,
  MinistryTeamId,
  TeamMembershipId,
} from '../entities';
export type MemberAssignedToTeam = DomainEvent<
  'member.assigned_to_team',
  Readonly<{
    teamMembershipId: string;
    organizationId: string;
    ministryId: string;
    ministryTeamId: string;
    ministryMembershipId: string;
  }>
>;
export function createMemberAssignedToTeam(input: {
  eventId: DomainEventId;
  occurredAt: Instant;
  teamMembershipId: TeamMembershipId;
  organizationId: OrganizationId;
  ministryId: MinistryId;
  ministryTeamId: MinistryTeamId;
  ministryMembershipId: MinistryMembershipId;
}): MemberAssignedToTeam {
  return createDomainEvent({
    eventId: input.eventId,
    name: 'member.assigned_to_team',
    occurredAt: input.occurredAt,
    payload: {
      teamMembershipId: input.teamMembershipId.value,
      organizationId: input.organizationId.value,
      ministryId: input.ministryId.value,
      ministryTeamId: input.ministryTeamId.value,
      ministryMembershipId: input.ministryMembershipId.value,
    },
  });
}
export function isMemberAssignedToTeam(event: DomainEvent): event is MemberAssignedToTeam {
  return event.name === 'member.assigned_to_team';
}
