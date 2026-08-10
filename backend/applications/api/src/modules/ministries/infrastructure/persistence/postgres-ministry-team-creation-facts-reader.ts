import type { OrganizationId } from '@/modules/organizations/domain';
import type { Pool } from 'pg';
import type { MinistryTeamCreationFactsReader } from '../../application';
import type { MinistryId, MinistryTeamName } from '../../domain';
export class PostgresMinistryTeamCreationFactsReader implements MinistryTeamCreationFactsReader {
  constructor(private readonly pool: Pool) {}
  async find(organizationId: OrganizationId, ministryId: MinistryId, name: MinistryTeamName) {
    const result = await this.pool.query<{
      ministry_is_active: boolean;
      active_name_exists: boolean;
    }>(
      `SELECT EXISTS (SELECT 1 FROM ministries WHERE organization_id = $1 AND id = $2 AND status = 1) AS ministry_is_active, EXISTS (SELECT 1 FROM ministry_teams WHERE organization_id = $1 AND ministry_id = $2 AND status = 1 AND lower(name) = lower($3)) AS active_name_exists`,
      [organizationId.value, ministryId.value, name.toString()],
    );
    return Object.freeze({
      ministryIsActive: result.rows[0]?.ministry_is_active ?? false,
      activeNameExists: result.rows[0]?.active_name_exists ?? false,
    });
  }
}
