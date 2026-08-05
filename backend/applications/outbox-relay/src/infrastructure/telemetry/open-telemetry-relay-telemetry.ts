import type {
  ClaimedOutboxMessage,
  RelayTelemetry,
  RelayTraceAttribute,
} from '@/application';
import {
  context,
  propagation,
  ROOT_CONTEXT,
  SpanStatusCode,
  trace,
  type Context,
  type Span,
  type SpanOptions,
  type TextMapGetter,
} from '@opentelemetry/api';

const tracer = trace.getTracer('@servir/outbox-relay');
const headerGetter: TextMapGetter<Record<string, string>> = {
  keys: (carrier) => Object.keys(carrier),
  get: (carrier, key) => carrier[key],
};

function recordFailure(span: Span, error: unknown): void {
  span.recordException(error instanceof Error ? error : String(error));
  span.setStatus({ code: SpanStatusCode.ERROR });
}

async function runInSpan<T>(
  name: string,
  parent: Context,
  options: SpanOptions,
  operation: () => Promise<T>,
): Promise<T> {
  return tracer.startActiveSpan(name, options, parent, async (span) => {
    try {
      return await operation();
    } catch (error) {
      recordFailure(span, error);
      throw error;
    } finally {
      span.end();
    }
  });
}

function linkedContext(message: ClaimedOutboxMessage): Context | undefined {
  if (message.traceContext === undefined) {
    return undefined;
  }

  return propagation.extract(
    ROOT_CONTEXT,
    { ...message.traceContext },
    headerGetter,
  );
}

export class OpenTelemetryRelayTelemetry implements RelayTelemetry {
  traceBatch<T>(
    operation: () => Promise<T>,
    completed?: (result: T) => void,
  ): Promise<T> {
    return runInSpan('outbox.relay.batch', ROOT_CONTEXT, {}, async () => {
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
