import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createExecutionContext, parseCorrelationId } from '@/shared/application/context';

import { HttpExecutionContextUnavailableError, requireHttpExecutionContext } from '.';

describe('requireHttpExecutionContext', () => {
  it('preserves an execution context created at the HTTP boundary', () => {
    const correlationId = parseCorrelationId('correlation-123');

    assert.equal(correlationId.success, true);

    if (!correlationId.success) {
      throw new Error('Invalid deterministic correlation ID');
    }

    const context = createExecutionContext({
      correlationId: correlationId.value,
    });

    assert.equal(requireHttpExecutionContext(context), context);
  });

  it('classifies an unavailable execution context by stable code', () => {
    assert.throws(
      () => requireHttpExecutionContext(null),
      (error: unknown) =>
        error instanceof HttpExecutionContextUnavailableError &&
        error.code === 'http.execution_context_unavailable',
    );
  });
});
