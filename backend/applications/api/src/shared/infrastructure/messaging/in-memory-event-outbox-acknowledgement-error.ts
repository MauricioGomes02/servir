import type { MessageId } from '@/shared/application/messaging';

export const InMemoryEventOutboxAcknowledgementErrorCode =
  'event.outbox.acknowledgement.out_of_order' as const;

export class InMemoryEventOutboxAcknowledgementError extends Error {
  readonly code = InMemoryEventOutboxAcknowledgementErrorCode;

  constructor(
    readonly expectedMessageId: MessageId | undefined,
    readonly receivedMessageId: MessageId,
  ) {
    super(InMemoryEventOutboxAcknowledgementErrorCode);
    this.name = 'InMemoryEventOutboxAcknowledgementError';
  }
}
