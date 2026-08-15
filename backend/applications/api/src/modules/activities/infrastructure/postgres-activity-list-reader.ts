import type { ActivityListCriteria, ActivityListReader, ActivityPage } from '../application';
import { ActivityId } from '../domain';
import type { Pool } from 'pg';

export class PostgresActivityListReader implements ActivityListReader {
  constructor(private readonly pool: Pool) {}

  async list(criteria: ActivityListCriteria): Promise<ActivityPage | undefined> {
    const organization = await this.pool.query('SELECT 1 FROM organizations WHERE id = $1', [
      criteria.organizationId.toString(),
    ]);
    if (organization.rowCount === 0) return undefined;
    const values: unknown[] = [criteria.organizationId.toString()];
    const filters = ['a.organization_id = $1'];
    if (criteria.status !== undefined) {
      values.push(criteria.status === 'active' ? 1 : 2);
      filters.push(`a.status = $${values.length}`);
    }
    if (criteria.search !== undefined) {
      values.push(`${criteria.search}%`);
      filters.push(`lower(a.name) LIKE lower($${values.length})`);
    }
    const where = filters.join(' AND ');
    const count = await this.pool.query(
      `SELECT count(*)::integer AS total FROM activities a WHERE ${where}`,
      values,
    );
    values.push(criteria.pageSize, (criteria.page - 1) * criteria.pageSize);
    const result = await this.pool.query(
      `SELECT a.id, a.name, a.status, count(am.ministry_id)::integer AS ministry_count
       FROM activities a
       LEFT JOIN activity_ministries am
         ON am.organization_id = a.organization_id AND am.activity_id = a.id
       WHERE ${where}
       GROUP BY a.id, a.name, a.status
       ORDER BY lower(a.name), a.id LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values,
    );
    const items = result.rows.map((row: Record<string, unknown>) => {
      const id = ActivityId.create(row.id);
      if (
        !id.success ||
        typeof row.name !== 'string' ||
        (row.status !== 1 && row.status !== 2) ||
        typeof row.ministry_count !== 'number'
      )
        throw new Error('activity_list.invalid_persisted_row');
      return Object.freeze({
        id: id.value,
        name: row.name,
        status: row.status === 1 ? ('active' as const) : ('inactive' as const),
        ministryCount: row.ministry_count,
      });
    });
    const totalItems = (count.rows[0] as { total: number }).total;
    return Object.freeze({
      items: Object.freeze(items),
      pagination: Object.freeze({
        page: criteria.page,
        pageSize: criteria.pageSize,
        totalItems,
        totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / criteria.pageSize),
      }),
    });
  }
}
