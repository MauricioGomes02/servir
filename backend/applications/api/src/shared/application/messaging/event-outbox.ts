import type { EventEnvelope } from './event-envelope';

export interface EventOutbox {
  add(envelopes: ReadonlyArray<EventEnvelope>): Promise<void>;
}
