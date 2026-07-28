import {
  createEventEnvelope,
  type EventEnvelope,
  type EventOutbox,
} from '@/shared/application/messaging';

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
}
