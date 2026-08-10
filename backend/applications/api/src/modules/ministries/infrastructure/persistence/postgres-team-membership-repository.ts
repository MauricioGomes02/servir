import { failure, success } from '@/shared/core/result';
import type { PoolClient } from 'pg';
import type { TeamMembershipRepository } from '../../application';
import { TeamMembershipAssignmentPolicyErrorCodes, type TeamMembership } from '../../domain';
export class PostgresTeamMembershipRepository implements TeamMembershipRepository {
  constructor(private readonly client: PoolClient) {}
  async add(membership: TeamMembership) {
    const result = await this.client.query(
      `INSERT INTO team_memberships (id, organization_id, ministry_id, ministry_team_id, ministry_membership_id, status, assigned_at) VALUES ($1,$2,$3,$4,$5,1,$6) ON CONFLICT (organization_id,ministry_id,ministry_team_id,ministry_membership_id) WHERE status=1 DO NOTHING RETURNING id`,
      [
        membership.id.value,
        membership.organizationId.value,
        membership.ministryId.value,
        membership.ministryTeamId.value,
        membership.ministryMembershipId.value,
        membership.assignedAt.toISOString(),
      ],
    );
    return result.rowCount === 0
      ? failure({
          code: TeamMembershipAssignmentPolicyErrorCodes.ActiveMembershipAlreadyExists,
          field: 'ministryMembershipId' as const,
        })
      : success();
  }
}
