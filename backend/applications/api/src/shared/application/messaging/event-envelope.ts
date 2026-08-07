import type { CorrelationId } from '@/shared/application/context';
import type { DomainEvent } from '@/shared/domain/domain-event';

import type { MessageId } from './message-id';

export interface EventEnvelope<TEvent extends DomainEvent = DomainEvent> {
  readonly messageId: MessageId;
  readonly event: TEvent;
  readonly correlationId: CorrelationId;
  readonly causationId?: MessageId;
}

export function createEventEnvelope<const TEvent extends DomainEvent>(
  envelope: EventEnvelope<TEvent>,
): EventEnvelope<TEvent> {
  return Object.freeze({
    ...envelope,
  });
}
