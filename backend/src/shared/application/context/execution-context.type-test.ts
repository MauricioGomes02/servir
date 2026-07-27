import type {
  CorrelationId,
  RequestId,
} from '.';

declare const correlationId: CorrelationId;

// @ts-expect-error CorrelationId nao pode substituir RequestId.
const requestId: RequestId = correlationId;

void requestId;
