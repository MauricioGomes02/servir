export class DuplicateEventSubscriptionError extends Error {
  readonly code = 'event_subscription.duplicate';

  constructor(
    readonly eventName: string,
    readonly handlerName: string,
  ) {
    super(
      `Handler "${handlerName}" is already subscribed to event "${eventName}"`,
    );

    this.name = 'DuplicateEventSubscriptionError';
  }
}
