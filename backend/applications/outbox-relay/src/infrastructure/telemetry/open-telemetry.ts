import {
  createPgInstrumentation,
  startOpenTelemetry as startNodeOpenTelemetry,
  type StartOpenTelemetryOptions,
  type TelemetryLifecycle,
} from '@servir/node-observability';

export type { TelemetryLifecycle } from '@servir/node-observability';

export type RelayOpenTelemetryOptions = Omit<StartOpenTelemetryOptions, 'instrumentations'>;

export function startOpenTelemetry(options: RelayOpenTelemetryOptions = {}): TelemetryLifecycle {
  return startNodeOpenTelemetry({
    ...options,
    instrumentations: [createPgInstrumentation()],
  });
}
