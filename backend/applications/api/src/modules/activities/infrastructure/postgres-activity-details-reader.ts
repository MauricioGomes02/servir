import type { ActivityDetails, ActivityDetailsReader } from '../application';
import { ActivityId, type ActivityStatus } from '../domain';
import type { OrganizationId } from '@/modules/organizations/domain';
import type { Pool } from 'pg';

interface ActivityDetailsRow {
  readonly id: unknown;
  readonly name: unknown;
  readonly status: unknown;
  readonly ministry_id: unknown;
  readonly ministry_name: unknown;
}

function activityStatus(code: unknown): ActivityStatus {
  if (code === 1) return 'active';
  if (code === 2) return 'inactive';
  throw new Error('activity_details.invalid_persisted_status');
}

export class PostgresActivityDetailsReader implements ActivityDetailsReader {
  constructor(private readonly pool: Pool) {}

  async find(
    organizationId: OrganizationId,
    activityId: ActivityId,
  ): Promise<ActivityDetails | undefined> {
    const result = await this.pool.query<ActivityDetailsRow>(
      `SELECT a.id, a.name, a.status, m.id AS ministry_id, m.name AS ministry_name
       FROM activities a
       LEFT JOIN activity_ministries am
         ON am.organization_id = a.organization_id AND am.activity_id = a.id
       LEFT JOIN ministries m
         ON m.organization_id = am.organization_id AND m.id = am.ministry_id
       WHERE a.organization_id = $1 AND a.id = $2
       ORDER BY lower(m.name), m.id`,
      [organizationId.toString(), activityId.toString()],
    );
    const first = result.rows[0];
    if (first === undefined) return undefined;
    const id = ActivityId.create(first.id);
    if (!id.success || typeof first.name !== 'string')
      throw new Error('activity_details.invalid_persisted_row');
    const ministries = result.rows.flatMap((row) => {
      if (row.ministry_id === null) return [];
      if (typeof row.ministry_id !== 'string' || typeof row.ministry_name !== 'string')
        throw new Error('activity_details.invalid_persisted_ministry');
      return [Object.freeze({ id: row.ministry_id, name: row.ministry_name })];
    });
    return Object.freeze({
      id: id.value,
      name: first.name,
      status: activityStatus(first.status),
      ministries: Object.freeze(ministries),
    });
  }
}
