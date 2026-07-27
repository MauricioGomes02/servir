import type { DomainEvent } from '@/shared/domain/domain-event';
import {
  Entity,
  type EntityId,
} from '@/shared/domain/entity';

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

  pullDomainEvents(): ReadonlyArray<TDomainEvent> {
    const pendingEvents = this.pendingDomainEvents;

    this.domainEvents = [];

    return pendingEvents;
  }
}
