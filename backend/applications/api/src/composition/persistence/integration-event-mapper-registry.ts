import type { EventEnvelope, IntegrationEvent } from '@/shared/application/messaging';
import type { DomainEvent } from '@/shared/domain/domain-event';
import { UnmappedDomainEventError } from '@/shared/infrastructure/messaging';

type Mapper = (event: DomainEvent) => IntegrationEvent;

export class DuplicateIntegrationEventMapperError extends Error {
  readonly code = 'integration_event.mapper.duplicate';
  constructor(eventName: string) {
    super(`A mapper is already registered for ${eventName}`);
    this.name = 'DuplicateIntegrationEventMapperError';
  }
}

export class IntegrationEventMapperRegistry {
  private readonly mappers = new Map<string, Mapper>();
  register<TEvent extends DomainEvent>(
    eventName: TEvent['name'],
    mapper: (event: TEvent) => IntegrationEvent,
  ): void {
    if (this.mappers.has(eventName)) throw new DuplicateIntegrationEventMapperError(eventName);
    this.mappers.set(eventName, mapper as Mapper);
  }
  map = (envelope: EventEnvelope): IntegrationEvent => {
    const mapper = this.mappers.get(envelope.event.name);
    if (mapper === undefined) throw new UnmappedDomainEventError(envelope.event.name);
    return mapper(envelope.event);
  };
}
