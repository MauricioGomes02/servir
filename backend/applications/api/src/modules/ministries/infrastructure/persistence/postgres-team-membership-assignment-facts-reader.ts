import type { OrganizationId } from '@/modules/organizations/domain';
import type { Pool } from 'pg';
import type { TeamMembershipAssignmentFactsReader } from '../../application';
import type { MinistryId, MinistryMembershipId, MinistryTeamId } from '../../domain';
export class PostgresTeamMembershipAssignmentFactsReader implements TeamMembershipAssignmentFactsReader {
  constructor(private readonly pool: Pool) {}
  async find(
    organizationId: OrganizationId,
    ministryId: MinistryId,
    teamId: MinistryTeamId,
    membershipId: MinistryMembershipId,
  ) {
    const result = await this.pool.query<{
      team_is_active: boolean;
      ministry_membership_is_active: boolean;
      active_team_membership_exists: boolean;
    }>(
      `SELECT EXISTS (SELECT 1 FROM ministry_teams WHERE organization_id=$1 AND ministry_id=$2 AND id=$3 AND status=1) AS team_is_active, EXISTS (SELECT 1 FROM ministry_memberships WHERE organization_id=$1 AND ministry_id=$2 AND id=$4 AND status=2) AS ministry_membership_is_active, EXISTS (SELECT 1 FROM team_memberships WHERE organization_id=$1 AND ministry_id=$2 AND ministry_team_id=$3 AND ministry_membership_id=$4 AND status=1) AS active_team_membership_exists`,
      [organizationId.value, ministryId.value, teamId.value, membershipId.value],
    );
    const row = result.rows[0];
    return Object.freeze({
      teamIsActive: row?.team_is_active ?? false,
      ministryMembershipIsActive: row?.ministry_membership_is_active ?? false,
      activeTeamMembershipExists: row?.active_team_membership_exists ?? false,
    });
  }
}
