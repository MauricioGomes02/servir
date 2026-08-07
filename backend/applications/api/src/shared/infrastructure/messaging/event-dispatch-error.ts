import type { MessageId } from '@/shared/application/messaging';

export interface EventHandlerFailure {
  readonly handlerName: string;
  readonly cause: unknown;
}

export class EventDispatchError extends AggregateError {
  readonly code = 'event.dispatch.failed';
  readonly failures: ReadonlyArray<EventHandlerFailure>;

  constructor(
    readonly eventName: string,
    readonly messageId: MessageId,
    failures: ReadonlyArray<EventHandlerFailure>,
  ) {
    super(
      failures.map((failure) => failure.cause),
      `Failed to dispatch event "${eventName}" to ${failures.length} handler(s)`,
    );

    this.name = 'EventDispatchError';
    this.failures = Object.freeze(
      failures.map((failure) =>
        Object.freeze({
          ...failure,
        }),
      ),
    );
  }
}
