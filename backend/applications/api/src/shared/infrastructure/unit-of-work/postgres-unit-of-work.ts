import type { UnitOfWork } from '@/shared/application/unit-of-work';
import type { Pool, PoolClient } from 'pg';

import {
  PostgresUnitOfWorkError,
  PostgresUnitOfWorkErrorCodes,
} from './postgres-unit-of-work-error';

export type PostgresScopeFactory<TScope extends object> = (client: PoolClient) => TScope;

export class PostgresUnitOfWork<TScope extends object> implements UnitOfWork<TScope> {
  constructor(
    private readonly pool: Pool,
    private readonly createScope: PostgresScopeFactory<TScope>,
  ) {}

  async execute<TResult>(work: (scope: TScope) => Promise<TResult>): Promise<TResult> {
    let client: PoolClient;

    try {
      client = await this.pool.connect();
    } catch (cause) {
      throw new PostgresUnitOfWorkError(
        PostgresUnitOfWorkErrorCodes.ConnectionAcquisitionFailed,
        cause,
      );
    }

    try {
      try {
        await client.query('BEGIN');
      } catch (cause) {
        throw new PostgresUnitOfWorkError(PostgresUnitOfWorkErrorCodes.BeginFailed, cause);
      }

      let result: TResult;

      try {
        result = await work(this.createScope(client));
      } catch (cause) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackCause) {
          throw new PostgresUnitOfWorkError(
            PostgresUnitOfWorkErrorCodes.RollbackFailed,
            rollbackCause,
          );
        }

        throw cause;
      }

      try {
        await client.query('COMMIT');
      } catch (cause) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackCause) {
          throw new PostgresUnitOfWorkError(
            PostgresUnitOfWorkErrorCodes.RollbackFailed,
            rollbackCause,
          );
        }

        throw new PostgresUnitOfWorkError(PostgresUnitOfWorkErrorCodes.CommitFailed, cause);
      }

      return result;
    } finally {
      client.release();
    }
  }
}
