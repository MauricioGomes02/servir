import type { Pool, PoolClient } from 'pg';

import type { ActivityCreationFactsReader, ActivityRepository } from '../application';
import { ActivityCreationPolicy } from '../domain';
import { failure, success } from '@/shared/core/result';

export class PostgresActivityPersistenceError extends Error {
  readonly code: string;

  constructor(
    operation: 'read_facts' | 'add',
    override readonly cause: unknown,
  ) {
    const code = `postgres_activity_persistence.${operation}_failed`;
    super(code, { cause });
    this.name = 'PostgresActivityPersistenceError';
    this.code = code;
  }
}

export class PostgresActivityCreationFactsReader implements ActivityCreationFactsReader {
  constructor(private readonly pool: Pool) {}

  async find(
    organizationId: Parameters<ActivityCreationFactsReader['find']>[0],
    name: Parameters<ActivityCreationFactsReader['find']>[1],
    ministryIds: Parameters<ActivityCreationFactsReader['find']>[2],
  ) {
    try {
      const result = await this.pool.query<{
        organization_exists: boolean;
        active_name_exists: boolean;
        active_ministry_ids: string[];
      }>(
        `SELECT
           EXISTS (SELECT 1 FROM organizations WHERE id = $1) AS organization_exists,
           EXISTS (
             SELECT 1 FROM activities
             WHERE organization_id = $1 AND status = 1 AND lower(name) = lower($2)
           ) AS active_name_exists,
           ARRAY(
             SELECT id::text FROM ministries
             WHERE organization_id = $1 AND status = 1 AND id = ANY($3::uuid[])
           ) AS active_ministry_ids`,
        [organizationId.toString(), name.toString(), ministryIds.map((id) => id.toString())],
      );
      const row = result.rows[0];
      return Object.freeze({
        organizationExists: row?.organization_exists ?? false,
        activeNameExists: row?.active_name_exists ?? false,
        activeMinistryIds: new Set(row?.active_ministry_ids ?? []),
      });
    } catch (cause) {
      throw new PostgresActivityPersistenceError('read_facts', cause);
    }
  }
}

export class PostgresActivityRepository implements ActivityRepository {
  constructor(private readonly client: PoolClient) {}

  async add(activity: Parameters<ActivityRepository['add']>[0]) {
    try {
      const inserted = await this.client.query(
        `INSERT INTO activities (id, organization_id, name, status)
         VALUES ($1, $2, $3, 1)
         ON CONFLICT (organization_id, lower(name)) WHERE status = 1
         DO NOTHING RETURNING id`,
        [activity.id.toString(), activity.organizationId.toString(), activity.name.toString()],
      );
      if (inserted.rowCount === 0)
        return failure(new ActivityCreationPolicy().activeNameConflict());

      await this.client.query(
        `INSERT INTO activity_ministries (organization_id, activity_id, ministry_id)
         SELECT $1, $2, ministry_id
         FROM unnest($3::uuid[]) AS ministry_id`,
        [
          activity.organizationId.toString(),
          activity.id.toString(),
          activity.ministryIds.map((id) => id.toString()),
        ],
      );
      return success();
    } catch (cause) {
      throw new PostgresActivityPersistenceError('add', cause);
    }
  }
}
