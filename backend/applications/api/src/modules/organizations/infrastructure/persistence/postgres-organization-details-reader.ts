import type {
  OrganizationDetails,
  OrganizationDetailsReader,
} from '@/modules/organizations/application';
import type { OrganizationId } from '@/modules/organizations/domain';
import type { Pool } from 'pg';

export class PostgresOrganizationDetailsReader implements OrganizationDetailsReader {
  constructor(private readonly pool: Pool) {}

  async findById(organizationId: OrganizationId): Promise<OrganizationDetails | undefined> {
    const result = await this.pool.query('SELECT name FROM organizations WHERE id = $1', [
      organizationId.toString(),
    ]);
    const row = result.rows[0] as { name?: unknown } | undefined;
    if (row === undefined) return undefined;
    if (typeof row.name !== 'string') throw new Error('organization_details.invalid_name');
    return Object.freeze({ id: organizationId, name: row.name });
  }
}
