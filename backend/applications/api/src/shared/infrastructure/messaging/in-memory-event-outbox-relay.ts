import {
  createLogRecord,
  LogLevels,
  type LogAttributes,
  type Logger,
} from '@/shared/application/logging';
import type { EventPublisher } from '@/shared/application/messaging';

import { InMemoryEventOutbox } from './in-memory-event-outbox';
import {
  InMemoryEventOutboxRelayError,
  InMemoryEventOutboxRelayErrorCodes,
} from './in-memory-event-outbox-relay-error';

const DEFAULT_INTERVAL_MILLISECONDS = 100;

function errorAttributes(error: unknown): LogAttributes {
  if (!(error instanceof Error)) {
    return { 'error.type': typeof error };
  }

  const attributes: Record<string, string> = {
    'error.type': error.name,
    'exception.message': error.message,
  };

  if ('code' in error && typeof error.code === 'string') {
    attributes['error.code'] = error.code;
  }

  if (error.stack !== undefined) {
    attributes['exception.stacktrace'] = error.stack;
  }

  return attributes;
}

export class InMemoryEventOutboxRelay {
  private activeFlush: Promise<void> | undefined;
  private timer: NodeJS.Timeout | undefined;

  constructor(
    private readonly outbox: InMemoryEventOutbox,
    private readonly publisher: EventPublisher,
    private readonly logger: Logger,
  ) {}

  flush(): Promise<void> {
    if (this.activeFlush !== undefined) {
      return this.activeFlush;
    }

    const flush = this.publishPending().finally(() => {
      if (this.activeFlush === flush) {
        this.activeFlush = undefined;
      }
    });

    this.activeFlush = flush;
    return flush;
  }

  start(intervalMilliseconds = DEFAULT_INTERVAL_MILLISECONDS): void {
    if (
      !Number.isInteger(intervalMilliseconds)
      || intervalMilliseconds <= 0
    ) {
      throw new InMemoryEventOutboxRelayError(
        InMemoryEventOutboxRelayErrorCodes.InvalidInterval,
      );
    }

    if (this.timer !== undefined) {
      return;
    }

    this.timer = setInterval(() => {
      void this.flush().catch(() => undefined);
    }, intervalMilliseconds);
    this.timer.unref();
  }

  async stop(): Promise<void> {
    if (this.timer !== undefined) {
      clearInterval(this.timer);
      this.timer = undefined;
    }

    try {
      await this.flush();
    } catch {
      // The failure was logged and the envelope remains pending.
    }
  }

  private async publishPending(): Promise<void> {
    let envelope = this.outbox.nextEnvelope;

    while (envelope !== undefined) {
      try {
        await this.publisher.publish(envelope);
      } catch (cause) {
        this.logger.log(createLogRecord({
          level: LogLevels.Error,
          eventName: 'event.outbox.publish.failed',
          occurredAt: envelope.event.occurredAt.toISOString(),
          context: {
            correlationId: envelope.correlationId,
            messageId: envelope.messageId,
            causationId: envelope.causationId,
          },
          attributes: {
            'event.name': envelope.event.name,
            ...errorAttributes(cause),
          },
        }));

        throw new InMemoryEventOutboxRelayError(
          InMemoryEventOutboxRelayErrorCodes.PublishFailed,
          envelope.messageId,
          { cause },
        );
      }

      this.outbox.acknowledge(envelope.messageId);
      envelope = this.outbox.nextEnvelope;
    }
  }
}
