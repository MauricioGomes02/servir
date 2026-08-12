import type { MinistryListCriteria, MinistryListReader, MinistryPage } from '../../application';
import { MinistryId } from '../../domain';
import type { Pool } from 'pg';

export class PostgresMinistryListReader implements MinistryListReader {
  constructor(private readonly pool: Pool) {}

  async list(criteria: MinistryListCriteria): Promise<MinistryPage | undefined> {
    const organization = await this.pool.query('SELECT 1 FROM organizations WHERE id = $1', [
      criteria.organizationId.toString(),
    ]);
    if (organization.rowCount === 0) return undefined;
    const values: unknown[] = [criteria.organizationId.toString()];
    const filters = ['organization_id = $1'];
    if (criteria.status !== undefined) {
      values.push(criteria.status === 'active' ? 1 : 2);
      filters.push(`status = $${values.length}`);
    }
    if (criteria.search !== undefined) {
      values.push(`${criteria.search}%`);
      filters.push(`lower(name) LIKE lower($${values.length})`);
    }
    const where = filters.join(' AND ');
    const count = await this.pool.query(
      `SELECT count(*)::integer AS total FROM ministries WHERE ${where}`,
      values,
    );
    values.push(criteria.pageSize, (criteria.page - 1) * criteria.pageSize);
    const result = await this.pool.query(
      `SELECT id, name, status FROM ministries WHERE ${where}
       ORDER BY lower(name), id LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values,
    );
    const items = result.rows.map((row: Record<string, unknown>) => {
      const id = MinistryId.create(row.id);
      if (!id.success || typeof row.name !== 'string' || (row.status !== 1 && row.status !== 2))
        throw new Error('ministry_list.invalid_persisted_row');
      return Object.freeze({
        id: id.value,
        name: row.name,
        status: row.status === 1 ? ('active' as const) : ('inactive' as const),
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
