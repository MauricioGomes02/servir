import type { MemberListCriteria, MemberListReader, MemberPage } from '../../application';
import { MemberId } from '../../domain';
import { fromMemberStatusCode, toMemberStatusCode } from './member-status-code';
import type { Pool } from 'pg';

export class PostgresMemberListReader implements MemberListReader {
  constructor(private readonly pool: Pool) {}

  async list(criteria: MemberListCriteria): Promise<MemberPage | undefined> {
    const organization = await this.pool.query('SELECT 1 FROM organizations WHERE id = $1', [
      criteria.organizationId.toString(),
    ]);
    if (organization.rowCount === 0) return undefined;

    const values: unknown[] = [criteria.organizationId.toString()];
    const filters = ['organization_id = $1'];
    if (criteria.status !== undefined) {
      values.push(toMemberStatusCode(criteria.status));
      filters.push(`status = $${values.length}`);
    }
    if (criteria.search !== undefined) {
      values.push(`${criteria.search}%`);
      filters.push(`lower(name) LIKE lower($${values.length})`);
    }

    const where = filters.join(' AND ');
    const count = await this.pool.query(
      `SELECT count(*)::integer AS total FROM members WHERE ${where}`,
      values,
    );
    values.push(criteria.pageSize, (criteria.page - 1) * criteria.pageSize);
    const result = await this.pool.query(
      `SELECT id, name, status FROM members WHERE ${where}
       ORDER BY lower(name), id LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values,
    );
    const items = result.rows.map((row: Record<string, unknown>) => {
      const id = MemberId.create(row.id);
      if (!id.success || typeof row.name !== 'string' || typeof row.status !== 'number')
        throw new Error('member_list.invalid_persisted_row');
      return Object.freeze({
        id: id.value,
        name: row.name,
        status: fromMemberStatusCode(row.status),
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
