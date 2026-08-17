import type { AuthenticatedActor, ExternalIdentityAssertion } from '../authentication';
import type { CorrelationId, ExecutionContext, RequestId } from '.';

declare const correlationId: CorrelationId;

// @ts-expect-error CorrelationId nao pode substituir RequestId.
const requestId: RequestId = correlationId;

void requestId;

declare const actor: AuthenticatedActor;
declare const externalIdentityAssertion: ExternalIdentityAssertion;

// @ts-expect-error Um contexto nao pode representar simultaneamente login normal e bootstrap.
const ambiguousIdentity: ExecutionContext = {
  actor,
  correlationId,
  externalIdentityAssertion,
};

void ambiguousIdentity;
