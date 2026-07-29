import type { MessageId } from '@/shared/application/messaging';

export const InMemoryEventOutboxRelayErrorCodes = {
  InvalidInterval: 'event.outbox.relay.interval.invalid',
  PublishFailed: 'event.outbox.relay.publish_failed',
} as const;

export type InMemoryEventOutboxRelayErrorCode =
  (typeof InMemoryEventOutboxRelayErrorCodes)[keyof typeof InMemoryEventOutboxRelayErrorCodes];

export class InMemoryEventOutboxRelayError extends Error {
  constructor(
    readonly code: InMemoryEventOutboxRelayErrorCode,
    readonly messageId?: MessageId,
    options?: ErrorOptions,
  ) {
    super(code, options);
    this.name = 'InMemoryEventOutboxRelayError';
  }
}
