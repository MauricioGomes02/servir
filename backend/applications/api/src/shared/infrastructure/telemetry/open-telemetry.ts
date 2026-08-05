import FastifyOtelInstrumentation from '@fastify/otel';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import {
  createPgInstrumentation,
  startOpenTelemetry as startNodeOpenTelemetry,
  type StartOpenTelemetryOptions,
  type TelemetryLifecycle,
} from '@servir/node-observability';

export type { TelemetryLifecycle } from '@servir/node-observability';

export type ApiOpenTelemetryOptions = Omit<
  StartOpenTelemetryOptions,
  'instrumentations'
>;

export function startOpenTelemetry(
  options: ApiOpenTelemetryOptions = {},
): TelemetryLifecycle {
  return startNodeOpenTelemetry({
    ...options,
    instrumentations: [
      new HttpInstrumentation(),
      createPgInstrumentation(),
      new FastifyOtelInstrumentation({
        instrumentHooks: false,
        registerOnInitialization: true,
      }),
    ],
  });
}
