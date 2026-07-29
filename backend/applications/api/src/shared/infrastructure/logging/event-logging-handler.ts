import {
  createLogRecord,
  LogLevels,
  type Logger,
} from '@/shared/application/logging';
import type {
  EventEnvelope,
  EventHandler,
} from '@/shared/application/messaging';
import type { DomainEvent } from '@/shared/domain/domain-event';

export class EventLoggingHandler implements EventHandler {
  readonly handlerName = 'observability.event_logging';

  constructor(private readonly logger: Logger) {}

  async handle(envelope: EventEnvelope<DomainEvent>): Promise<void> {
    this.logger.log(createLogRecord({
      level: LogLevels.Info,
      eventName: envelope.event.name,
      occurredAt: envelope.event.occurredAt,
      context: {
        correlationId: envelope.correlationId,
        messageId: envelope.messageId,
        causationId: envelope.causationId,
      },
      attributes: {
        'event.id': envelope.event.eventId,
      },
    }));
  }
}
