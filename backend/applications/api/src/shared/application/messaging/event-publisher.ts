import type { DomainEvent } from '@/shared/domain/domain-event';

import type { EventEnvelope } from './event-envelope';

export interface EventPublisher {
  publish<TEvent extends DomainEvent>(envelope: EventEnvelope<TEvent>): Promise<void>;
}
