import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createExecutionContext,
  ExecutionContextIdErrorCodes,
  parseCorrelationId,
  parseRequestId,
} from '.';

describe('ExecutionContext', () => {
  it('preserves validated identifiers in an immutable context', () => {
    const correlationId = parseCorrelationId(' correlation-123 ');
    const requestId = parseRequestId('request-456');

    assert.equal(correlationId.success, true);
    assert.equal(requestId.success, true);

    if (!correlationId.success || !requestId.success) {
      return;
    }

    const context = createExecutionContext({
      correlationId: correlationId.value,
      requestId: requestId.value,
    });

    assert.deepEqual(context, {
      correlationId: 'correlation-123',
      requestId: 'request-456',
    });
    assert.equal(Object.isFrozen(context), true);
  });

  it('rejects an identifier with an invalid type', () => {
    const result = parseCorrelationId(123);

    assert.deepEqual(result, {
      success: false,
      error: {
        code: ExecutionContextIdErrorCodes.InvalidType,
        field: 'correlationId',
      },
    });
  });

  it('rejects an empty identifier after trimming whitespace', () => {
    const result = parseRequestId('   ');

    assert.deepEqual(result, {
      success: false,
      error: {
        code: ExecutionContextIdErrorCodes.Empty,
        field: 'requestId',
      },
    });
  });

  it('accepts an identifier with exactly 128 characters', () => {
    const input = 'a'.repeat(128);

    const result = parseCorrelationId(input);

    assert.deepEqual(result, {
      success: true,
      value: input,
    });
  });

  it('rejects an identifier longer than 128 characters', () => {
    const result = parseCorrelationId('a'.repeat(129));

    assert.deepEqual(result, {
      success: false,
      error: {
        code: ExecutionContextIdErrorCodes.TooLong,
        field: 'correlationId',
        params: {
          maxLength: 128,
          actualLength: 129,
        },
      },
    });
  });
});
