import type {
  ClaimedOutboxMessage,
  RelayTelemetry,
  RelayTraceAttribute,
} from '@/application';
import {
  context,
  ROOT_CONTEXT,
  trace,
  type Context,
} from '@opentelemetry/api';
import {
  extractTraceContext,
  runInSpan,
} from '@servir/node-observability';

const tracer = trace.getTracer('@servir/outbox-relay');
function linkedContext(message: ClaimedOutboxMessage): Context | undefined {
  if (message.traceContext === undefined) {
    return undefined;
  }

  return extractTraceContext(message.traceContext);
}

export class OpenTelemetryRelayTelemetry implements RelayTelemetry {
  traceBatch<T>(
    operation: () => Promise<T>,
    completed?: (result: T) => void,
  ): Promise<T> {
    return runInSpan(tracer, 'outbox.relay.batch', ROOT_CONTEXT, {}, async () => {
      const result = await operation();

      try {
        completed?.(result);
      } catch {
        // Observability reactions cannot change durable delivery behavior.
      }

      return result;
    });
  }

  traceMessage<T>(
    message: ClaimedOutboxMessage,
    operation: () => Promise<T>,
  ): Promise<T> {
    const origin = linkedContext(message);
    const originSpanContext = origin === undefined
      ? undefined
      : trace.getSpanContext(origin);

    return runInSpan(
      tracer,
      'outbox.message.process',
      context.active(),
      {
        attributes: {
          'messaging.message.id': message.messageId,
          'messaging.destination.name': message.event.channel,
          'servir.messaging.event_type': message.event.type,
          'servir.outbox.attempt': message.attemptCount,
        },
        links: originSpanContext === undefined
          ? []
          : [{ context: originSpanContext }],
      },
      operation,
    );
  }

  addEvent(
    name: string,
    attributes?: Readonly<Record<string, RelayTraceAttribute>>,
  ): void {
    trace.getActiveSpan()?.addEvent(name, attributes);
  }

  setAttributes(
    attributes: Readonly<Record<string, RelayTraceAttribute>>,
  ): void {
    trace.getActiveSpan()?.setAttributes(attributes);
  }
}
