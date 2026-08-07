import {
  context,
  propagation,
  ROOT_CONTEXT,
  SpanStatusCode,
  type Context,
  type Span,
  type SpanOptions,
  type Tracer,
} from '@opentelemetry/api';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { NodeSDK, type NodeSDKConfiguration } from '@opentelemetry/sdk-node';

export const OpenTelemetryErrorCodes = {
  StartFailed: 'telemetry.start.failed',
  ShutdownFailed: 'telemetry.shutdown.failed',
} as const;

export type OpenTelemetryErrorCode =
  (typeof OpenTelemetryErrorCodes)[keyof typeof OpenTelemetryErrorCodes];

export class OpenTelemetryError extends Error {
  override readonly name = 'OpenTelemetryError';

  constructor(
    readonly code: OpenTelemetryErrorCode,
    options?: ErrorOptions,
  ) {
    super(code, options);
  }
}

export interface TelemetryLifecycle {
  readonly enabled: boolean;
  shutdown(): Promise<void>;
}

export interface TelemetrySdk {
  start(): void;
  shutdown(): Promise<void>;
}

export interface StartOpenTelemetryOptions {
  readonly environment?: NodeJS.ProcessEnv;
  readonly instrumentations?: NodeSDKConfiguration['instrumentations'];
  readonly sdkFactory?: (
    instrumentations: NodeSDKConfiguration['instrumentations'],
  ) => TelemetrySdk;
}

export interface DistributedTraceContext {
  readonly traceparent: string;
  readonly tracestate?: string;
}

function isDisabled(environment: NodeJS.ProcessEnv): boolean {
  return (
    environment.OTEL_SDK_DISABLED?.toLowerCase() === 'true' ||
    environment.OTEL_TRACES_EXPORTER?.toLowerCase() === 'none'
  );
}

function createSdk(instrumentations: NodeSDKConfiguration['instrumentations']): TelemetrySdk {
  return new NodeSDK({
    traceExporter: new OTLPTraceExporter(),
    textMapPropagator: new W3CTraceContextPropagator(),
    instrumentations,
  });
}

export function createPgInstrumentation(): PgInstrumentation {
  return new PgInstrumentation({ enhancedDatabaseReporting: false });
}

export function startOpenTelemetry(options: StartOpenTelemetryOptions = {}): TelemetryLifecycle {
  const environment = options.environment ?? process.env;

  if (isDisabled(environment)) {
    return { enabled: false, async shutdown() {} };
  }

  const instrumentations = options.instrumentations ?? [];
  const sdk = (options.sdkFactory ?? createSdk)(instrumentations);

  try {
    sdk.start();
  } catch (cause) {
    throw new OpenTelemetryError(OpenTelemetryErrorCodes.StartFailed, { cause });
  }

  return {
    enabled: true,
    async shutdown() {
      try {
        await sdk.shutdown();
      } catch (cause) {
        throw new OpenTelemetryError(OpenTelemetryErrorCodes.ShutdownFailed, { cause });
      }
    },
  };
}

export function captureActiveTraceContext(): DistributedTraceContext | undefined {
  const carrier: Record<string, string> = {};
  propagation.inject(context.active(), carrier);

  if (carrier.traceparent === undefined) {
    return undefined;
  }

  return Object.freeze({
    traceparent: carrier.traceparent,
    tracestate: carrier.tracestate,
  });
}

export function extractTraceContext(carrier: DistributedTraceContext): Context {
  return propagation.extract(ROOT_CONTEXT, { ...carrier });
}

export function recordSpanFailure(span: Span, error: unknown): void {
  span.recordException(error instanceof Error ? error : String(error));
  span.setStatus({ code: SpanStatusCode.ERROR });
}

export async function runInSpan<T>(
  tracer: Tracer,
  name: string,
  parent: Context,
  options: SpanOptions,
  operation: () => Promise<T>,
): Promise<T> {
  return tracer.startActiveSpan(name, options, parent, async (span) => {
    try {
      return await operation();
    } catch (error) {
      recordSpanFailure(span, error);
      throw error;
    } finally {
      span.end();
    }
  });
}
