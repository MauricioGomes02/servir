import type { Clock } from '@/shared/application/clock';
import type { CorrelationId, RequestId } from '@/shared/application/context';
import type { IdGenerator } from '@/shared/application/id-generator';
import type { Logger } from '@/shared/application/logging';
import type { Mediator } from '@/shared/application/mediator';
import type { MessageId } from '@/shared/application/messaging';
import type { DomainEventId } from '@/shared/domain/domain-event';
import type { InMemoryEventOutboxRelay } from '@/shared/infrastructure/messaging';
import type { MessageTranslator } from '@/shared/presentation';
import type { AwilixContainer } from 'awilix';

export interface EventRelayLifecycle {
  readonly relay?: InMemoryEventOutboxRelay;
}

export interface ApplicationCradle {
  readonly logger: Logger;
  readonly mediator: Mediator;
  readonly translator: MessageTranslator;
  readonly clock: Clock;
  readonly eventRelayLifecycle: EventRelayLifecycle;
  readonly domainEventIdGenerator: IdGenerator<DomainEventId>;
  readonly messageIdGenerator: IdGenerator<MessageId>;
  readonly requestIdGenerator: IdGenerator<RequestId>;
  readonly correlationIdGenerator: IdGenerator<CorrelationId>;
}

export type ApplicationContainer = AwilixContainer<ApplicationCradle>;
