import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createExecutionContext,
  ExecutionContextIdErrorCodes,
  parseCorrelationId,
  parseRequestId,
  type RequestId,
} from '.';

describe('ExecutionContext', () => {
  it('preserva os identificadores validados em um contexto imutavel', () => {
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

  it('mantem CorrelationId e RequestId nominalmente distintos', () => {
    const correlationId = parseCorrelationId('correlation-123');

    assert.equal(correlationId.success, true);

    if (!correlationId.success) {
      return;
    }

    // @ts-expect-error CorrelationId nao pode substituir RequestId.
    const requestId: RequestId = correlationId.value;

    assert.equal(requestId, 'correlation-123');
  });

  it('rejeita identificador com tipo invalido', () => {
    const result = parseCorrelationId(123);

    assert.deepEqual(result, {
      success: false,
      error: {
        code: ExecutionContextIdErrorCodes.InvalidType,
        field: 'correlationId',
      },
    });
  });

  it('rejeita identificador vazio depois de normalizar espacos', () => {
    const result = parseRequestId('   ');

    assert.deepEqual(result, {
      success: false,
      error: {
        code: ExecutionContextIdErrorCodes.Empty,
        field: 'requestId',
      },
    });
  });

  it('limita o tamanho de identificadores recebidos na borda', () => {
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
