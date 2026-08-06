import { failure, success } from '@/shared/core/result';
import type { PoolClient } from 'pg';
import type { MinistryRepository } from '../../application';
import { MinistryCreationPolicy, type Ministry } from '../../domain';
import { toMinistryStatusCode } from './ministry-status-code';
import { PostgresMinistryRepositoryError } from './postgres-ministry-repository-error';

export class PostgresMinistryRepository implements MinistryRepository {
  constructor(private readonly client: PoolClient) {}

  async save(ministry: Ministry) {
    try {
      const result = await this.client.query(
        `INSERT INTO ministries (id, organization_id, name, status)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (organization_id, lower(name)) WHERE status = 1
         DO NOTHING
         RETURNING id`,
        [ministry.id.toString(), ministry.organizationId.toString(), ministry.name.toString(), toMinistryStatusCode(ministry.status)],
      );
      return result.rowCount === 0
        ? failure(new MinistryCreationPolicy().activeNameConflict())
        : success();
    } catch (cause) {
      throw new PostgresMinistryRepositoryError(cause);
    }
  }
}
