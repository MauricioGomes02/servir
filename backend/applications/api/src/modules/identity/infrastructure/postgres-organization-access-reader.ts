import type { OrganizationAccessReader } from '../application';
import type { OrganizationId } from '@/modules/organizations/domain';
import type { UserId } from '../domain';
import type { Pool } from 'pg';

export class PostgresOrganizationAccessReader implements OrganizationAccessReader {
  constructor(private readonly pool: Pool) {}

  async hasActiveAccess(organizationId: OrganizationId, userId: UserId): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT 1
       FROM organization_accesses
       WHERE organization_id = $1
         AND user_id = $2
         AND status = 'active'
       LIMIT 1`,
      [organizationId.toString(), userId.toString()],
    );
    return result.rowCount === 1;
  }
}
