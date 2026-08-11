import type { OrganizationId } from '@/modules/organizations/domain';
import { AggregateRoot } from '@/shared/domain/aggregate-root';
import type { DomainEventId } from '@/shared/domain/domain-event';
import type { Instant } from '@/shared/domain/instant';
import { createTeamLeaderAppointed, type TeamLeaderAppointed } from '../events';
import type { MinistryId } from './ministry-id';
import type { MinistryTeamId } from './ministry-team-id';
import type { TeamLeadershipId } from './team-leadership-id';
import type { TeamMembershipId } from './team-membership-id';

export type TeamLeadershipStatus = 'active' | 'ended';
interface Props {
  readonly organizationId: OrganizationId;
  readonly ministryId: MinistryId;
  readonly ministryTeamId: MinistryTeamId;
  readonly teamMembershipId: TeamMembershipId;
  readonly status: TeamLeadershipStatus;
  readonly appointedAt: Instant;
}

export class TeamLeadership extends AggregateRoot<TeamLeadershipId, Props, TeamLeaderAppointed> {
  private constructor(id: TeamLeadershipId, props: Props) {
    super(id, props);
  }

  static appoint(input: {
    id: TeamLeadershipId;
    organizationId: OrganizationId;
    ministryId: MinistryId;
    ministryTeamId: MinistryTeamId;
    teamMembershipId: TeamMembershipId;
    eventId: DomainEventId;
    appointedAt: Instant;
  }) {
    const leadership = new TeamLeadership(input.id, {
      organizationId: input.organizationId,
      ministryId: input.ministryId,
      ministryTeamId: input.ministryTeamId,
      teamMembershipId: input.teamMembershipId,
      status: 'active',
      appointedAt: input.appointedAt,
    });
    leadership.recordDomainEvent(
      createTeamLeaderAppointed({
        ...input,
        teamLeadershipId: input.id,
        occurredAt: input.appointedAt,
      }),
    );
    return leadership;
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get ministryId() {
    return this.props.ministryId;
  }
  get ministryTeamId() {
    return this.props.ministryTeamId;
  }
  get teamMembershipId() {
    return this.props.teamMembershipId;
  }
  get status() {
    return this.props.status;
  }
  get appointedAt() {
    return this.props.appointedAt;
  }
}
