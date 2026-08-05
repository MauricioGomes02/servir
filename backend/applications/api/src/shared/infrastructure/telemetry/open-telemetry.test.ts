import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { startOpenTelemetry } from './open-telemetry';

describe('API OpenTelemetry composition', () => {
  it('configures HTTP, PostgreSQL, and Fastify instrumentations', async () => {
    let instrumentationNames: string[] = [];
    const telemetry = startOpenTelemetry({
      environment: {},
      sdkFactory: (instrumentations) => {
        instrumentationNames = instrumentations.flat().map(
          (instrumentation) => instrumentation.instrumentationName,
        );
        return { start() {}, async shutdown() {} };
      },
    });

    await telemetry.shutdown();

    assert.deepEqual(instrumentationNames, [
      '@opentelemetry/instrumentation-http',
      '@opentelemetry/instrumentation-pg',
      '@fastify/otel',
    ]);
  });
});
