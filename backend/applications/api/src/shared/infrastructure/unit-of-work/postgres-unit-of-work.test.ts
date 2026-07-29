import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type {
  Pool,
  PoolClient,
  QueryResult,
} from 'pg';

import {
  PostgresUnitOfWork,
  PostgresUnitOfWorkError,
  PostgresUnitOfWorkErrorCodes,
} from '.';

interface FakeClient {
  readonly queries: string[];
  released: boolean;
  query(command: string): Promise<QueryResult>;
  release(): void;
}

function createPool(queryFailure?: Readonly<{
  command: string;
  cause: Error;
}>) {
  const client: FakeClient = {
    queries: [],
    released: false,
    async query(command) {
      this.queries.push(command);

      if (queryFailure?.command === command) {
        throw queryFailure.cause;
      }

      return {} as QueryResult;
    },
    release() {
      this.released = true;
    },
  };
  const pool = {
    async connect() {
      return client;
    },
  } as unknown as Pool;

  return {
    client,
    pool,
  };
}

describe('PostgresUnitOfWork', () => {
  it('commits work with a scope bound to the acquired client', async () => {
    const fixture = createPool();
    const unitOfWork = new PostgresUnitOfWork(
      fixture.pool,
      (client) => ({ client }),
    );

    const result = await unitOfWork.execute(async (scope) => {
      assert.equal(scope.client, fixture.client as unknown as PoolClient);
      return 'completed' as const;
    });

    assert.equal(result, 'completed');
    assert.deepEqual(fixture.client.queries, ['BEGIN', 'COMMIT']);
    assert.equal(fixture.client.released, true);
  });

  it('rolls back and preserves a work failure', async () => {
    const fixture = createPool();
    const failure = new Error('repository unavailable');
    const unitOfWork = new PostgresUnitOfWork(
      fixture.pool,
      () => ({}),
    );

    await assert.rejects(
      unitOfWork.execute(async () => {
        throw failure;
      }),
      (error: unknown) => error === failure,
    );

    assert.deepEqual(fixture.client.queries, ['BEGIN', 'ROLLBACK']);
    assert.equal(fixture.client.released, true);
  });

  it('classifies a commit failure and always releases the client', async () => {
    const failure = new Error('commit unavailable');
    const fixture = createPool({ command: 'COMMIT', cause: failure });
    const unitOfWork = new PostgresUnitOfWork(
      fixture.pool,
      () => ({}),
    );

    await assert.rejects(
      unitOfWork.execute(async () => 'completed'),
      (error: unknown) => error instanceof PostgresUnitOfWorkError
        && error.code === PostgresUnitOfWorkErrorCodes.CommitFailed
        && error.cause === failure,
    );

    assert.deepEqual(
      fixture.client.queries,
      ['BEGIN', 'COMMIT', 'ROLLBACK'],
    );
    assert.equal(fixture.client.released, true);
  });
});
