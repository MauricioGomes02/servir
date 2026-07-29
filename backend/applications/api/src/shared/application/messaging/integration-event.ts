import type { DomainEventPayload } from '@/shared/domain/domain-event';
import type { Instant } from '@/shared/domain/instant';

export interface IntegrationEvent<
  TName extends string = string,
  TVersion extends number = number,
  TPayload extends DomainEventPayload = DomainEventPayload,
> {
  readonly name: TName;
  readonly version: TVersion;
  readonly occurredAt: Instant;
  readonly aggregateId?: string;
  readonly partitionKey?: string;
  readonly payload: TPayload;
  readonly metadata: Readonly<Record<string, never>>;
}

export type IntegrationEventMapper = (
  envelope: import('./event-envelope').EventEnvelope,
) => IntegrationEvent;
