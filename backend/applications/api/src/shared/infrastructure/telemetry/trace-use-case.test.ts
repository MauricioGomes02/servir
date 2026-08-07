import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { traceUseCase } from './trace-use-case';

describe('traceUseCase', () => {
  it('preserves the use case result when tracing is unavailable', async () => {
    const result = await traceUseCase('CreateOrganization', async () => ({
      organizationId: 'organization-123',
    }));

    assert.deepEqual(result, { organizationId: 'organization-123' });
  });

  it('preserves the original use case failure', async () => {
    const failure = new Error('use_case.failed');

    await assert.rejects(
      traceUseCase('CreateOrganization', async () => {
        throw failure;
      }),
      (error: unknown) => error === failure,
    );
  });
});
