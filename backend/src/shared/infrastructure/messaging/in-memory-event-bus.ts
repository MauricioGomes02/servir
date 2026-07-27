import type {
  EventEnvelope,
  EventHandler,
  EventPublisher,
} from '@/shared/application/messaging';
import type { DomainEvent } from '@/shared/domain/domain-event';

import { DuplicateEventSubscriptionError } from './duplicate-event-subscription-error';
import {
  EventDispatchError,
  type EventHandlerFailure,
} from './event-dispatch-error';

interface RegisteredEventHandler {
  readonly handlerName: string;
  readonly handle: (
    envelope: EventEnvelope,
  ) => Promise<void>;
}

export class InMemoryEventBus implements EventPublisher {
  private readonly subscriptions = new Map<
    string,
    RegisteredEventHandler[]
  >();

  subscribe<TEvent extends DomainEvent>(
    eventName: TEvent['name'],
    handler: EventHandler<TEvent>,
  ): void {
    const handlers = this.subscriptions.get(eventName) ?? [];

    if (
      handlers.some(
        (registered) => registered.handlerName === handler.handlerName,
      )
    ) {
      throw new DuplicateEventSubscriptionError(
        eventName,
        handler.handlerName,
      );
    }

    const registeredHandler: RegisteredEventHandler = {
      handlerName: handler.handlerName,
      handle: (envelope) => handler.handle(
        envelope as EventEnvelope<TEvent>,
      ),
    };

    this.subscriptions.set(eventName, [
      ...handlers,
      registeredHandler,
    ]);
  }

  async publish<TEvent extends DomainEvent>(
    envelope: EventEnvelope<TEvent>,
  ): Promise<void> {
    const handlers = [
      ...(this.subscriptions.get(envelope.event.name) ?? []),
    ];

    const results = await Promise.allSettled(
      handlers.map(
        (handler) => Promise.resolve().then(
          () => handler.handle(envelope),
        ),
      ),
    );

    const failures: EventHandlerFailure[] = [];

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        failures.push({
          handlerName: handlers[index]!.handlerName,
          cause: result.reason,
        });
      }
    });

    if (failures.length > 0) {
      throw new EventDispatchError(
        envelope.event.name,
        envelope.messageId,
        failures,
      );
    }
  }
}
