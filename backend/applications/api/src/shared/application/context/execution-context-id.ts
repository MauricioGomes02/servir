import {
  failure,
  success,
  type Result,
} from '@/shared/core/result';

import {
  ExecutionContextIdErrorCodes,
  type ExecutionContextIdError,
} from './execution-context-id-error';

const MAX_EXECUTION_CONTEXT_ID_LENGTH = 128;

declare const correlationIdBrand: unique symbol;
declare const requestIdBrand: unique symbol;

export type CorrelationId = string & {
  readonly [correlationIdBrand]: 'CorrelationId';
};

export type RequestId = string & {
  readonly [requestIdBrand]: 'RequestId';
};

function parseExecutionContextId<TId extends string>(
  input: unknown,
  field: ExecutionContextIdError['field'],
): Result<TId, ExecutionContextIdError> {
  if (typeof input !== 'string') {
    return failure({
      code: ExecutionContextIdErrorCodes.InvalidType,
      field,
    });
  }

  const value = input.trim();

  if (value.length === 0) {
    return failure({
      code: ExecutionContextIdErrorCodes.Empty,
      field,
    });
  }

  if (value.length > MAX_EXECUTION_CONTEXT_ID_LENGTH) {
    return failure({
      code: ExecutionContextIdErrorCodes.TooLong,
      field,
      params: {
        maxLength: MAX_EXECUTION_CONTEXT_ID_LENGTH,
        actualLength: value.length,
      },
    });
  }

  return success(value as TId);
}

export function parseCorrelationId(
  input: unknown,
): Result<CorrelationId, ExecutionContextIdError> {
  return parseExecutionContextId(input, 'correlationId');
}

export function parseRequestId(
  input: unknown,
): Result<RequestId, ExecutionContextIdError> {
  return parseExecutionContextId(input, 'requestId');
}
