import type { Pool, PoolClient } from 'pg';
import { failure, success } from '@/shared/core/result';
import type {
  ActivityOccurrenceRepository,
  ActivityOccurrenceSchedulingFactsReader,
} from '../application';
import { ActivityOccurrenceSchedulingPolicy } from '../domain';

export class PostgresActivityOccurrencePersistenceError extends Error {
  readonly code: string;
  constructor(
    operation: 'read_facts' | 'add',
    override readonly cause: unknown,
  ) {
    const code = `postgres_activity_occurrence_persistence.${operation}_failed`;
    super(code, { cause });
    this.name = 'PostgresActivityOccurrencePersistenceError';
    this.code = code;
  }
}

export class PostgresActivityOccurrenceSchedulingFactsReader implements ActivityOccurrenceSchedulingFactsReader {
  constructor(private readonly pool: Pool) {}
  async find(
    organizationId: Parameters<ActivityOccurrenceSchedulingFactsReader['find']>[0],
    activityId: Parameters<ActivityOccurrenceSchedulingFactsReader['find']>[1],
    scheduledAt: Parameters<ActivityOccurrenceSchedulingFactsReader['find']>[2],
  ) {
    try {
      const result = await this.pool.query<{
        activity_active: boolean;
        scheduled_at_exists: boolean;
      }>(
        `SELECT
           EXISTS (
             SELECT 1 FROM activities
             WHERE organization_id = $1 AND id = $2 AND status = 1
           ) AS activity_active,
           EXISTS (
             SELECT 1 FROM activity_occurrences
             WHERE organization_id = $1 AND activity_id = $2
               AND scheduled_at = $3 AND status = 1
           ) AS scheduled_at_exists`,
        [organizationId.toString(), activityId.toString(), scheduledAt.toISOString()],
      );
      return Object.freeze({
        activityActive: result.rows[0]?.activity_active ?? false,
        scheduledAtExists: result.rows[0]?.scheduled_at_exists ?? false,
      });
    } catch (cause) {
      throw new PostgresActivityOccurrencePersistenceError('read_facts', cause);
    }
  }
}

export class PostgresActivityOccurrenceRepository implements ActivityOccurrenceRepository {
  constructor(private readonly client: PoolClient) {}
  async add(occurrence: Parameters<ActivityOccurrenceRepository['add']>[0]) {
    try {
      const result = await this.client.query(
        `INSERT INTO activity_occurrences (
           id, organization_id, activity_id, civil_date, civil_time, time_zone_id,
           resolved_offset, scheduled_at, origin, revision, status
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, 1, 1)
         ON CONFLICT (organization_id, activity_id, scheduled_at) WHERE status = 1
         DO NOTHING RETURNING id`,
        [
          occurrence.id.toString(),
          occurrence.organizationId.toString(),
          occurrence.activityId.toString(),
          occurrence.civilDate.toISOString(),
          occurrence.civilTime.toISOString(),
          occurrence.timeZoneId.toString(),
          occurrence.resolvedOffset.toString(),
          occurrence.scheduledAt.toISOString(),
        ],
      );
      return result.rowCount === 0
        ? failure(new ActivityOccurrenceSchedulingPolicy().scheduledAtConflict())
        : success();
    } catch (cause) {
      throw new PostgresActivityOccurrencePersistenceError('add', cause);
    }
  }
}
