import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { NodeSDK } from '@opentelemetry/sdk-node';

export const OpenTelemetryErrorCodes = {
  StartFailed: 'telemetry.start.failed',
  ShutdownFailed: 'telemetry.shutdown.failed',
} as const;

export class OpenTelemetryError extends Error {
  override readonly name = 'OpenTelemetryError';

  constructor(
    readonly code: typeof OpenTelemetryErrorCodes[
      keyof typeof OpenTelemetryErrorCodes
    ],
    options?: ErrorOptions,
  ) {
    super(code, options);
  }
}

export interface TelemetryLifecycle {
  readonly enabled: boolean;
  shutdown(): Promise<void>;
}

interface TelemetrySdk {
  start(): void;
  shutdown(): Promise<void>;
}

export interface StartOpenTelemetryOptions {
  readonly environment?: NodeJS.ProcessEnv;
  readonly sdkFactory?: () => TelemetrySdk;
}

function createSdk(): TelemetrySdk {
  return new NodeSDK({
    traceExporter: new OTLPTraceExporter(),
    textMapPropagator: new W3CTraceContextPropagator(),
    instrumentations: [new PgInstrumentation({
      enhancedDatabaseReporting: false,
    })],
  });
}

export function startOpenTelemetry(
  options: StartOpenTelemetryOptions = {},
): TelemetryLifecycle {
  const environment = options.environment ?? process.env;
  const disabled = environment.OTEL_SDK_DISABLED?.toLowerCase() === 'true'
    || environment.OTEL_TRACES_EXPORTER?.toLowerCase() === 'none';

  if (disabled) {
    return { enabled: false, async shutdown() {} };
  }

  const sdk = (options.sdkFactory ?? createSdk)();

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
        throw new OpenTelemetryError(
          OpenTelemetryErrorCodes.ShutdownFailed,
          { cause },
        );
      }
    },
  };
}
