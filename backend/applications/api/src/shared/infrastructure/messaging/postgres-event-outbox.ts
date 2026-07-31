import type {
  EventEnvelope,
  EventOutbox,
  IntegrationEventMapper,
} from '@/shared/application/messaging';
import type { PoolClient } from 'pg';

import { PostgresEventOutboxError } from './postgres-event-outbox-error';

export interface DistributedTraceContext {
  readonly traceparent: string;
  readonly tracestate?: string;
}

export type ActiveTraceContextProvider = () => DistributedTraceContext | undefined;

export class PostgresEventOutbox implements EventOutbox {
  constructor(
    private readonly client: PoolClient,
    private readonly mapIntegrationEvent: IntegrationEventMapper,
    private readonly activeTraceContext: ActiveTraceContextProvider = () => undefined,
  ) {}

  async add(envelopes: ReadonlyArray<EventEnvelope>): Promise<void> {
    try {
      for (const envelope of envelopes) {
        const integrationEvent = this.mapIntegrationEvent(envelope);

        await this.client.query(
          `INSERT INTO outbox_messages (
             message_id,
             event_id,
             event_name,
             occurred_at,
             correlation_id,
             causation_id,
             payload,
             event_version,
             aggregate_id,
             partition_key,
             metadata
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            envelope.messageId,
            envelope.event.eventId,
            integrationEvent.name,
            integrationEvent.occurredAt,
            envelope.correlationId,
            envelope.causationId ?? null,
            integrationEvent.payload,
            integrationEvent.version,
            integrationEvent.aggregateId ?? null,
            integrationEvent.partitionKey ?? null,
            {
              event: integrationEvent.metadata,
              trace: this.activeTraceContext() ?? {},
            },
          ],
        );
      }
    } catch (cause) {
      throw new PostgresEventOutboxError(cause);
    }
  }
}
