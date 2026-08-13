import type { MinistryDetails, MinistryDetailsReader } from '../../application';
import { MinistryId, MinistryRoleId, type MinistryStatus } from '../../domain';
import type { OrganizationId } from '@/modules/organizations/domain';
import type { Pool } from 'pg';

interface MinistryDetailsRow {
  readonly id: unknown;
  readonly name: unknown;
  readonly status: unknown;
  readonly role_id: unknown;
  readonly role_name: unknown;
  readonly role_status: unknown;
}

function ministryStatus(code: unknown): MinistryStatus {
  if (code === 1) return 'active';
  if (code === 2) return 'inactive';
  throw new Error('ministry_details.invalid_persisted_status');
}

export class PostgresMinistryDetailsReader implements MinistryDetailsReader {
  constructor(private readonly pool: Pool) {}

  async find(
    organizationId: OrganizationId,
    ministryId: MinistryId,
  ): Promise<MinistryDetails | undefined> {
    const result = await this.pool.query<MinistryDetailsRow>(
      `SELECT m.id, m.name, m.status,
              r.id AS role_id, r.name AS role_name, r.status AS role_status
       FROM ministries m
       LEFT JOIN ministry_roles r
         ON r.organization_id = m.organization_id AND r.ministry_id = m.id
       WHERE m.organization_id = $1 AND m.id = $2
       ORDER BY lower(r.name), r.id`,
      [organizationId.toString(), ministryId.toString()],
    );
    const first = result.rows[0];
    if (first === undefined) return undefined;
    const id = MinistryId.create(first.id);
    if (!id.success || typeof first.name !== 'string')
      throw new Error('ministry_details.invalid_persisted_row');
    const roles = result.rows.flatMap((row) => {
      if (row.role_id === null) return [];
      const roleId = MinistryRoleId.create(row.role_id);
      if (
        !roleId.success ||
        typeof row.role_name !== 'string' ||
        (row.role_status !== 1 && row.role_status !== 2)
      )
        throw new Error('ministry_details.invalid_persisted_role');
      return [
        Object.freeze({
          id: roleId.value,
          name: row.role_name,
          status: row.role_status === 1 ? ('active' as const) : ('inactive' as const),
        }),
      ];
    });
    return Object.freeze({
      id: id.value,
      name: first.name,
      status: ministryStatus(first.status),
      roles: Object.freeze(roles),
    });
  }
}
