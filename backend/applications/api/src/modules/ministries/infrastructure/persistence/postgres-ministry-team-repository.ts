import { failure, success } from '@/shared/core/result';
import type { PoolClient } from 'pg';
import type { MinistryTeamRepository } from '../../application';
import { MinistryTeamCreationPolicyErrorCodes, type MinistryTeam } from '../../domain';
export class PostgresMinistryTeamRepository implements MinistryTeamRepository {
  constructor(private readonly client: PoolClient) {}
  async add(team: MinistryTeam) {
    const result = await this.client.query(
      `INSERT INTO ministry_teams (id, organization_id, ministry_id, name, status) VALUES ($1, $2, $3, $4, 1) ON CONFLICT (organization_id, ministry_id, lower(name)) WHERE status = 1 DO NOTHING RETURNING id`,
      [team.id.value, team.organizationId.value, team.ministryId.value, team.name.toString()],
    );
    return result.rowCount === 0
      ? failure({
          code: MinistryTeamCreationPolicyErrorCodes.ActiveNameAlreadyExists,
          field: 'name' as const,
        })
      : success();
  }
}
