import type { OrganizationId } from '@/modules/organizations/domain';
import { AggregateRoot } from '@/shared/domain/aggregate-root';
import type { DomainEventId } from '@/shared/domain/domain-event';
import type { Instant } from '@/shared/domain/instant';
import { createMemberAssignedToTeam, type MemberAssignedToTeam } from '../events';
import type { MinistryId } from './ministry-id';
import type { MinistryMembershipId } from './ministry-membership-id';
import type { MinistryTeamId } from './ministry-team-id';
import type { TeamMembershipId } from './team-membership-id';
export type TeamMembershipStatus = 'active' | 'ended';
interface Props {
  readonly organizationId: OrganizationId;
  readonly ministryId: MinistryId;
  readonly ministryTeamId: MinistryTeamId;
  readonly ministryMembershipId: MinistryMembershipId;
  readonly status: TeamMembershipStatus;
  readonly assignedAt: Instant;
}
export class TeamMembership extends AggregateRoot<TeamMembershipId, Props, MemberAssignedToTeam> {
  private constructor(id: TeamMembershipId, props: Props) {
    super(id, props);
  }
  static assign(input: {
    id: TeamMembershipId;
    organizationId: OrganizationId;
    ministryId: MinistryId;
    ministryTeamId: MinistryTeamId;
    ministryMembershipId: MinistryMembershipId;
    eventId: DomainEventId;
    assignedAt: Instant;
  }) {
    const membership = new TeamMembership(input.id, {
      organizationId: input.organizationId,
      ministryId: input.ministryId,
      ministryTeamId: input.ministryTeamId,
      ministryMembershipId: input.ministryMembershipId,
      status: 'active',
      assignedAt: input.assignedAt,
    });
    membership.recordDomainEvent(
      createMemberAssignedToTeam({
        ...input,
        teamMembershipId: input.id,
        occurredAt: input.assignedAt,
      }),
    );
    return membership;
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
  get ministryMembershipId() {
    return this.props.ministryMembershipId;
  }
  get status() {
    return this.props.status;
  }
  get assignedAt() {
    return this.props.assignedAt;
  }
}
