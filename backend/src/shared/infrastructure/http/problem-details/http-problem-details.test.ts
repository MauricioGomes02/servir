import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  parseCorrelationId,
  parseRequestId,
} from '@/shared/application/context';

import {
  createHttpProblemDetails,
  createValidationProblemDetails,
  HttpProblemTypes,
} from './http-problem-details';

describe('HttpProblemDetails', () => {
  it('representa uma ocorrencia HTTP sem detalhes tecnicos', () => {
    const correlationId = parseCorrelationId('correlation-123');
    const requestId = parseRequestId('request-123');
    assert.equal(correlationId.success, true);
    assert.equal(requestId.success, true);

    if (!correlationId.success || !requestId.success) {
      throw new Error('Invalid deterministic test fixture');
    }

    assert.deepEqual(createHttpProblemDetails({
      type: HttpProblemTypes.InternalError,
      title: 'Nao foi possivel processar a solicitacao.',
      status: 500,
      correlationId: correlationId.value,
      requestId: requestId.value,
    }), {
      type: '/problems/internal-error',
      title: 'Nao foi possivel processar a solicitacao.',
      status: 500,
      instance: 'urn:servir:request:request-123',
      correlationId: 'correlation-123',
    });
  });

  it('representa erros de validacao por codigo e JSON Pointer', () => {
    const correlationId = parseCorrelationId('correlation-123');
    const requestId = parseRequestId('request-123');
    assert.equal(correlationId.success, true);
    assert.equal(requestId.success, true);

    if (!correlationId.success || !requestId.success) {
      throw new Error('Invalid deterministic test fixture');
    }

    assert.deepEqual(createValidationProblemDetails({
      title: 'A requisicao contem dados invalidos.',
      status: 422,
      correlationId: correlationId.value,
      requestId: requestId.value,
      errors: [{
        code: 'organization.name.empty',
        message: 'Informe o nome da organizacao.',
        field: 'organization/name',
        correlationId: correlationId.value,
      }],
    }), {
      type: '/problems/validation-error',
      title: 'A requisicao contem dados invalidos.',
      status: 422,
      instance: 'urn:servir:request:request-123',
      correlationId: 'correlation-123',
      errors: [{
        code: 'organization.name.empty',
        detail: 'Informe o nome da organizacao.',
        pointer: '#/organization~1name',
      }],
    });
  });
});
