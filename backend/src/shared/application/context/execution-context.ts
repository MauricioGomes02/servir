import type {
  CorrelationId,
  RequestId,
} from './execution-context-id';

export interface ExecutionContext {
  readonly correlationId: CorrelationId;
  readonly requestId?: RequestId;
}

export function createExecutionContext(
  context: ExecutionContext,
): ExecutionContext {
  return Object.freeze({
    ...context,
  });
}
