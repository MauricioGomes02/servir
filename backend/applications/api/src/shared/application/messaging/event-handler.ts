import type { DomainEvent } from '@/shared/domain/domain-event';

import type { EventEnvelope } from './event-envelope';

export interface EventHandler<TEvent extends DomainEvent = DomainEvent> {
  readonly handlerName: string;

  handle(envelope: EventEnvelope<TEvent>): Promise<void>;
}
