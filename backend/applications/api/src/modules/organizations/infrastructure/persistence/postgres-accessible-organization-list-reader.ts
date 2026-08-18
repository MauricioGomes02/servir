import type {
  AccessibleOrganizationListItem,
  AccessibleOrganizationListReader,
} from '@/modules/organizations/application';
import { OrganizationId } from '@/modules/organizations/domain';
import type { UserId } from '@/modules/identity/domain';
import type { Pool } from 'pg';

interface AccessibleOrganizationRow {
  readonly id: unknown;
  readonly name: unknown;
}

export class PostgresAccessibleOrganizationListReader implements AccessibleOrganizationListReader {
  constructor(private readonly pool: Pool) {}

  async listByUserId(userId: UserId): Promise<readonly AccessibleOrganizationListItem[]> {
    const result = await this.pool.query(
      `SELECT o.id, o.name
         FROM organization_accesses a
         JOIN organizations o ON o.id = a.organization_id
        WHERE a.user_id = $1
          AND a.status = 'active'
        ORDER BY o.name ASC, o.id ASC`,
      [userId.toString()],
    );
    return Object.freeze(result.rows.map((row) => this.mapRow(row as AccessibleOrganizationRow)));
  }

  private mapRow(row: AccessibleOrganizationRow): AccessibleOrganizationListItem {
    const id = OrganizationId.create(row.id);
    if (!id.success) throw new Error('accessible_organization.invalid_id');
    if (typeof row.name !== 'string') throw new Error('accessible_organization.invalid_name');
    return Object.freeze({ id: id.value, name: row.name });
  }
}
