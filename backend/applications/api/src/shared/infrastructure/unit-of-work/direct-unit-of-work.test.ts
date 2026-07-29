import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DirectUnitOfWork } from '.';

interface TestScope {
  readonly organizations: {
    readonly name: string;
  };
}

describe('DirectUnitOfWork', () => {
  it('runs work with the configured scope and preserves its result', async () => {
    const scope: TestScope = {
      organizations: {
        name: 'organizations',
      },
    };
    const unitOfWork = new DirectUnitOfWork(scope);

    const result = await unitOfWork.execute(async (currentScope) => {
      assert.equal(currentScope, scope);
      return 'completed' as const;
    });

    assert.equal(result, 'completed');
  });

  it('propagates a work failure without losing its identity', async () => {
    const failure = new Error('repository unavailable');
    const unitOfWork = new DirectUnitOfWork<TestScope>({
      organizations: {
        name: 'organizations',
      },
    });

    await assert.rejects(
      unitOfWork.execute(async () => {
        throw failure;
      }),
      (error: unknown) => error === failure,
    );
  });

  it('converts a synchronous work failure into a rejection', async () => {
    const failure = new Error('synchronous failure');
    const unitOfWork = new DirectUnitOfWork<TestScope>({
      organizations: {
        name: 'organizations',
      },
    });

    const execution = unitOfWork.execute(() => {
      throw failure;
    });

    await assert.rejects(
      execution,
      (error: unknown) => error === failure,
    );
  });
});
