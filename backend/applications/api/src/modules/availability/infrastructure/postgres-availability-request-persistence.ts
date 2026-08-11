import type { Pool, PoolClient } from 'pg';
import { success } from '@/shared/core/result';
import type {
  AvailabilityRequestOpeningFactsReader,
  AvailabilityRequestRepository,
} from '../application';

export class PostgresAvailabilityRequestPersistenceError extends Error {
  readonly code: string;
  constructor(
    operation: 'read_facts' | 'add',
    override readonly cause: unknown,
  ) {
    const code = `postgres_availability_request_persistence.${operation}_failed`;
    super(code, { cause });
    this.name = 'PostgresAvailabilityRequestPersistenceError';
    this.code = code;
  }
}

export class PostgresAvailabilityRequestOpeningFactsReader implements AvailabilityRequestOpeningFactsReader {
  constructor(private readonly pool: Pool) {}
  async find(
    organizationId: Parameters<AvailabilityRequestOpeningFactsReader['find']>[0],
    ministryTeamId: Parameters<AvailabilityRequestOpeningFactsReader['find']>[1],
  ) {
    try {
      const result = await this.pool.query<{ team_active: boolean }>(
        `SELECT EXISTS (
           SELECT 1 FROM ministry_teams
           WHERE organization_id = $1 AND id = $2 AND status = 1
         ) AS team_active`,
        [organizationId.toString(), ministryTeamId.toString()],
      );
      return Object.freeze({ teamActive: result.rows[0]?.team_active ?? false });
    } catch (cause) {
      throw new PostgresAvailabilityRequestPersistenceError('read_facts', cause);
    }
  }
}

export class PostgresAvailabilityRequestRepository implements AvailabilityRequestRepository {
  constructor(private readonly client: PoolClient) {}
  async add(request: Parameters<AvailabilityRequestRepository['add']>[0]) {
    try {
      await this.client.query(
        `INSERT INTO availability_requests (
           id, organization_id, ministry_team_id, start_date, end_date, respond_by, status
         ) VALUES ($1, $2, $3, $4, $5, $6, 1)`,
        [
          request.id.toString(),
          request.organizationId.toString(),
          request.ministryTeamId.toString(),
          request.period.startDate.toISOString(),
          request.period.endDate.toISOString(),
          request.respondBy.toISOString(),
        ],
      );
      return success();
    } catch (cause) {
      throw new PostgresAvailabilityRequestPersistenceError('add', cause);
    }
  }
}
