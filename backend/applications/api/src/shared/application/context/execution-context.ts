import type { CorrelationId, RequestId } from './execution-context-id';
import type { AuthenticatedActor, ExternalIdentityAssertion } from '../authentication';

interface ExecutionContextMetadata {
  readonly correlationId: CorrelationId;
  readonly requestId?: RequestId;
}

type ExecutionIdentity =
  | {
      readonly actor: AuthenticatedActor;
      readonly externalIdentityAssertion?: never;
    }
  | {
      readonly actor?: never;
      readonly externalIdentityAssertion: ExternalIdentityAssertion;
    }
  | {
      readonly actor?: undefined;
      readonly externalIdentityAssertion?: undefined;
    };

export type ExecutionContext = ExecutionContextMetadata & ExecutionIdentity;

export function createExecutionContext(context: ExecutionContext): ExecutionContext {
  return Object.freeze({
    ...context,
  });
}
