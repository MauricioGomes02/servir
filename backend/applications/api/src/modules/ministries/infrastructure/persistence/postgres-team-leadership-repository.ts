import { failure, success } from '@/shared/core/result';
import type { PoolClient } from 'pg';
import type { TeamLeadershipRepository } from '../../application';
import { TeamLeaderAppointmentPolicyErrorCodes, type TeamLeadership } from '../../domain';

export class PostgresTeamLeadershipRepository implements TeamLeadershipRepository {
  constructor(private readonly client: PoolClient) {}

  async add(leadership: TeamLeadership) {
    const result = await this.client.query(
      `INSERT INTO team_leaderships (id, organization_id, ministry_id, ministry_team_id, team_membership_id, status, appointed_at) VALUES ($1,$2,$3,$4,$5,1,$6) ON CONFLICT (organization_id,ministry_id,ministry_team_id) WHERE status=1 DO NOTHING RETURNING id`,
      [
        leadership.id.value,
        leadership.organizationId.value,
        leadership.ministryId.value,
        leadership.ministryTeamId.value,
        leadership.teamMembershipId.value,
        leadership.appointedAt.toISOString(),
      ],
    );
    return result.rowCount === 0
      ? failure({
          code: TeamLeaderAppointmentPolicyErrorCodes.ActiveLeadershipAlreadyExists,
          field: 'ministryTeamId' as const,
        })
      : success();
  }
}
