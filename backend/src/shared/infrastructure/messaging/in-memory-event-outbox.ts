import {
  createEventEnvelope,
  type EventEnvelope,
  type EventOutbox,
  type MessageId,
} from '@/shared/application/messaging';

import { InMemoryEventOutboxAcknowledgementError } from './in-memory-event-outbox-acknowledgement-error';

export class InMemoryEventOutbox implements EventOutbox {
  private readonly storedEnvelopes: EventEnvelope[] = [];

  async add(
    envelopes: ReadonlyArray<EventEnvelope>,
  ): Promise<void> {
    this.storedEnvelopes.push(
      ...envelopes.map((envelope) => createEventEnvelope(envelope)),
    );
  }

  get envelopes(): ReadonlyArray<EventEnvelope> {
    return Object.freeze([...this.storedEnvelopes]);
  }

  get nextEnvelope(): EventEnvelope | undefined {
    return this.storedEnvelopes[0];
  }

  acknowledge(messageId: MessageId): void {
    const expectedMessageId = this.nextEnvelope?.messageId;

    if (expectedMessageId !== messageId) {
      throw new InMemoryEventOutboxAcknowledgementError(
        expectedMessageId,
        messageId,
      );
    }

    this.storedEnvelopes.shift();
  }
}
