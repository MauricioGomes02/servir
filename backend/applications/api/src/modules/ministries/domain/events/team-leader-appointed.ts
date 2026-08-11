import type { OrganizationId } from '@/modules/organizations/domain';
import {
  createDomainEvent,
  type DomainEvent,
  type DomainEventId,
} from '@/shared/domain/domain-event';
import type { Instant } from '@/shared/domain/instant';
import type { MinistryId, MinistryTeamId, TeamLeadershipId, TeamMembershipId } from '../entities';

export type TeamLeaderAppointed = DomainEvent<
  'team_leader.appointed',
  Readonly<{
    teamLeadershipId: string;
    organizationId: string;
    ministryId: string;
    ministryTeamId: string;
    teamMembershipId: string;
  }>
>;

export function createTeamLeaderAppointed(input: {
  eventId: DomainEventId;
  occurredAt: Instant;
  teamLeadershipId: TeamLeadershipId;
  organizationId: OrganizationId;
  ministryId: MinistryId;
  ministryTeamId: MinistryTeamId;
  teamMembershipId: TeamMembershipId;
}): TeamLeaderAppointed {
  return createDomainEvent({
    eventId: input.eventId,
    name: 'team_leader.appointed',
    occurredAt: input.occurredAt,
    payload: {
      teamLeadershipId: input.teamLeadershipId.value,
      organizationId: input.organizationId.value,
      ministryId: input.ministryId.value,
      ministryTeamId: input.ministryTeamId.value,
      teamMembershipId: input.teamMembershipId.value,
    },
  });
}
