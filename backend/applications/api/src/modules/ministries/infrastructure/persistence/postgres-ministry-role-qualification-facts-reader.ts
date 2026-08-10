import type { OrganizationId } from '@/modules/organizations/domain';
import type { PoolClient } from 'pg';
import type { MinistryRoleQualificationFactsReader } from '../../application';
import type { MinistryId, MinistryRoleId } from '../../domain';
export class PostgresMinistryRoleQualificationFactsReader implements MinistryRoleQualificationFactsReader {
  constructor(private readonly client: PoolClient) {}
  async isRoleActive(
    organizationId: OrganizationId,
    ministryId: MinistryId,
    ministryRoleId: MinistryRoleId,
  ): Promise<boolean> {
    const result = await this.client.query(
      'SELECT 1 FROM ministry_roles WHERE id = $1 AND ministry_id = $2 AND organization_id = $3 AND status = 1',
      [ministryRoleId.value, ministryId.value, organizationId.value],
    );
    return result.rowCount !== 0;
  }
}
