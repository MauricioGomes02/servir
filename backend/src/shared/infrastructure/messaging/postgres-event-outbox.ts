import type {
  EventEnvelope,
  EventOutbox,
} from '@/shared/application/messaging';
import type { PoolClient } from 'pg';

import { PostgresEventOutboxError } from './postgres-event-outbox-error';

export class PostgresEventOutbox implements EventOutbox {
  constructor(private readonly client: PoolClient) {}

  async add(envelopes: ReadonlyArray<EventEnvelope>): Promise<void> {
    try {
      for (const envelope of envelopes) {
        await this.client.query(
          `INSERT INTO outbox_messages (
             message_id,
             event_id,
             event_name,
             occurred_at,
             correlation_id,
             causation_id,
             payload
           ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            envelope.messageId,
            envelope.event.eventId,
            envelope.event.name,
            envelope.event.occurredAt.toISOString(),
            envelope.correlationId,
            envelope.causationId ?? null,
            envelope.event.payload,
          ],
        );
      }
    } catch (cause) {
      throw new PostgresEventOutboxError(cause);
    }
  }
}
