import type { OrganizationId } from '@/modules/organizations/domain';
import type { Pool } from 'pg';
import type { TeamLeaderAppointmentFactsReader } from '../../application';
import type { MinistryId, MinistryTeamId, TeamMembershipId } from '../../domain';

export class PostgresTeamLeaderAppointmentFactsReader implements TeamLeaderAppointmentFactsReader {
  constructor(private readonly pool: Pool) {}

  async find(
    organizationId: OrganizationId,
    ministryId: MinistryId,
    teamId: MinistryTeamId,
    membershipId: TeamMembershipId,
  ) {
    const result = await this.pool.query<{
      team_is_active: boolean;
      team_membership_is_active: boolean;
      active_leadership_exists: boolean;
    }>(
      `SELECT EXISTS (SELECT 1 FROM ministry_teams WHERE organization_id=$1 AND ministry_id=$2 AND id=$3 AND status=1) AS team_is_active, EXISTS (SELECT 1 FROM team_memberships WHERE organization_id=$1 AND ministry_id=$2 AND ministry_team_id=$3 AND id=$4 AND status=1) AS team_membership_is_active, EXISTS (SELECT 1 FROM team_leaderships WHERE organization_id=$1 AND ministry_id=$2 AND ministry_team_id=$3 AND status=1) AS active_leadership_exists`,
      [organizationId.value, ministryId.value, teamId.value, membershipId.value],
    );
    const row = result.rows[0];
    return Object.freeze({
      teamIsActive: row?.team_is_active ?? false,
      teamMembershipIsActive: row?.team_membership_is_active ?? false,
      activeLeadershipExists: row?.active_leadership_exists ?? false,
    });
  }
}
