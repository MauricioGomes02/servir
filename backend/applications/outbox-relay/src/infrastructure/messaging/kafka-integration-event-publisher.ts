import { context, propagation, trace } from '@opentelemetry/api';
import { recordSpanFailure } from '@servir/node-observability';

import { IntegrationEventPublicationError } from '@/application';
import type { ClaimedOutboxMessage, IntegrationEventPublisher } from '@/application';

import { mapToStructuredCloudEvent } from './cloud-event';

export const KafkaPublicationErrorCodes = {
  InvalidConfiguration: 'kafka.publisher.invalid_configuration',
  SerializationFailed: 'kafka.publisher.serialization_failed',
  PublishFailed: 'kafka.publisher.publish_failed',
  PublishRejected: 'kafka.publisher.publish_rejected',
} as const;

interface KafkaRecord {
  readonly topic: string;
  readonly acks: -1;
  readonly timeout: number;
  readonly messages: Array<{
    key: string | null;
    value: string;
    headers: Record<string, string>;
  }>;
}

export interface KafkaProducer {
  send(record: KafkaRecord): Promise<unknown>;
}

export interface KafkaIntegrationEventPublisherOptions {
  readonly producer: KafkaProducer;
  readonly timeoutMs: number;
}

const tracer = trace.getTracer('@servir/outbox-relay');
function assertConfiguration(options: KafkaIntegrationEventPublisherOptions): void {
  if (!Number.isInteger(options.timeoutMs) || options.timeoutMs <= 0) {
    throw new IntegrationEventPublicationError(KafkaPublicationErrorCodes.InvalidConfiguration, {
      retryable: false,
    });
  }
}

function isExplicitlyNonRetryable(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && 'retriable' in error && error.retriable === false
  );
}

export class KafkaIntegrationEventPublisher implements IntegrationEventPublisher {
  constructor(private readonly options: KafkaIntegrationEventPublisherOptions) {
    assertConfiguration(options);
  }

  async publish(message: ClaimedOutboxMessage): Promise<void> {
    await tracer.startActiveSpan('kafka.publish', async (span) => {
      span.setAttributes({
        'servir.messaging.system': 'kafka',
        'servir.messaging.topic': message.event.channel,
      });

      try {
        let value: string;

        try {
          value = JSON.stringify(mapToStructuredCloudEvent(message));
        } catch {
          throw new IntegrationEventPublicationError(
            KafkaPublicationErrorCodes.SerializationFailed,
            { retryable: false },
          );
        }

        const headers: Record<string, string> = {
          'content-type': 'application/cloudevents+json',
        };
        propagation.inject(context.active(), headers);
        if (headers.traceparent === undefined && message.traceContext !== undefined) {
          headers.traceparent = message.traceContext.traceparent;

          if (message.traceContext.tracestate !== undefined) {
            headers.tracestate = message.traceContext.tracestate;
          }
        }

        await this.options.producer.send({
          topic: message.event.channel,
          acks: -1,
          timeout: this.options.timeoutMs,
          messages: [
            {
              key: message.event.partitionKey ?? null,
              value,
              headers,
            },
          ],
        });
      } catch (cause) {
        recordSpanFailure(span, cause);

        if (cause instanceof IntegrationEventPublicationError) {
          throw cause;
        }

        throw new IntegrationEventPublicationError(
          isExplicitlyNonRetryable(cause)
            ? KafkaPublicationErrorCodes.PublishRejected
            : KafkaPublicationErrorCodes.PublishFailed,
          { retryable: !isExplicitlyNonRetryable(cause) },
        );
      } finally {
        span.end();
      }
    });
  }
}
