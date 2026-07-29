import type { DomainEvent } from '@/shared/domain/domain-event';
import {
  Entity,
  type EntityId,
} from '@/shared/domain/entity';

import { DomainEventAcknowledgementError } from './domain-event-acknowledgement-error';

export abstract class AggregateRoot<
  TId extends EntityId<string>,
  TProps extends object,
  TDomainEvent extends DomainEvent = DomainEvent,
> extends Entity<TId, TProps> {
  private domainEvents: TDomainEvent[] = [];

  protected recordDomainEvent(
    event: TDomainEvent,
  ): void {
    this.domainEvents.push(event);
  }

  get pendingDomainEvents(): ReadonlyArray<TDomainEvent> {
    return Object.freeze([
      ...this.domainEvents,
    ]);
  }

  acknowledgeDomainEvents(
    events: ReadonlyArray<TDomainEvent>,
  ): void {
    const matchesPendingSequence = events.every(
      (event, index) => (
        this.domainEvents[index]?.eventId === event.eventId
      ),
    );

    if (!matchesPendingSequence) {
      throw new DomainEventAcknowledgementError(
        this.domainEvents.length,
        events.length,
      );
    }

    this.domainEvents = this.domainEvents.slice(events.length);
  }
}
