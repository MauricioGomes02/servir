import type { CorrelationId, RequestId } from './execution-context-id';
import type { AuthenticatedActor } from '../authentication';

export interface ExecutionContext {
  readonly actor?: AuthenticatedActor;
  readonly correlationId: CorrelationId;
  readonly requestId?: RequestId;
}

export function createExecutionContext(context: ExecutionContext): ExecutionContext {
  return Object.freeze({
    ...context,
  });
}
