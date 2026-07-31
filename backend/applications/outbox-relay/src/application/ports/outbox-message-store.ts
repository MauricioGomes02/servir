import type { IntegrationEvent } from '@servir/integration-messaging';

export interface DistributedTraceContext {
  readonly traceparent: string;
  readonly tracestate?: string;
}

export interface ClaimedOutboxMessage<
  TEvent extends IntegrationEvent = IntegrationEvent,
> {
  readonly messageId: string;
  readonly eventId: string;
  readonly correlationId: string;
  readonly causationId?: string;
  readonly traceContext?: DistributedTraceContext;
  readonly event: TEvent;
  readonly attemptCount: number;
  readonly leaseId: string;
  readonly leaseExpiresAt: string;
}

export interface ClaimOutboxMessages {
  readonly leaseId: string;
  readonly claimedAt: string;
  readonly leaseExpiresAt: string;
  readonly limit: number;
}

export interface OutboxMessageStore {
  claim(input: ClaimOutboxMessages): Promise<readonly ClaimedOutboxMessage[]>;
  markPublished(input: Readonly<{
    messageId: string;
    leaseId: string;
    publishedAt: string;
  }>): Promise<void>;
  reschedule(input: Readonly<{
    messageId: string;
    leaseId: string;
    failedAt: string;
    availableAt: string;
    errorCode: string;
  }>): Promise<void>;
  markFailed(input: Readonly<{
    messageId: string;
    leaseId: string;
    failedAt: string;
    errorCode: string;
  }>): Promise<void>;
}
