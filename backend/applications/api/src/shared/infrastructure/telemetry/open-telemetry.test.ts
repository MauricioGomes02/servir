import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createPgInstrumentation,
  OpenTelemetryError,
  OpenTelemetryErrorCodes,
  startOpenTelemetry,
} from './open-telemetry';

describe('PgInstrumentation', () => {
  it('keeps enhanced database reporting disabled by default', () => {
    const instrumentation = createPgInstrumentation();

    assert.equal(
      instrumentation.getConfig().enhancedDatabaseReporting,
      false,
    );
  });
});

describe('startOpenTelemetry', () => {
  it('does not create the SDK when telemetry is disabled', async () => {
    let sdkCreated = false;
    const telemetry = startOpenTelemetry({
      environment: { OTEL_SDK_DISABLED: 'true' },
      sdkFactory: () => {
        sdkCreated = true;
        throw new Error('unexpected SDK creation');
      },
    });

    await telemetry.shutdown();

    assert.equal(telemetry.enabled, false);
    assert.equal(sdkCreated, false);
  });

  it('does not create the SDK when the trace exporter is disabled', async () => {
    let sdkCreated = false;
    const telemetry = startOpenTelemetry({
      environment: { OTEL_TRACES_EXPORTER: 'NoNe' },
      sdkFactory: () => {
        sdkCreated = true;
        throw new Error('unexpected SDK creation');
      },
    });

    await telemetry.shutdown();

    assert.equal(telemetry.enabled, false);
    assert.equal(sdkCreated, false);
  });

  it('starts and shuts down the configured SDK', async () => {
    const calls: string[] = [];
    const telemetry = startOpenTelemetry({
      environment: {},
      sdkFactory: () => ({
        start: () => calls.push('start'),
        shutdown: async () => {
          calls.push('shutdown');
        },
      }),
    });

    await telemetry.shutdown();

    assert.equal(telemetry.enabled, true);
    assert.deepEqual(calls, ['start', 'shutdown']);
  });

  it('codes a startup failure without depending on its message', () => {
    assert.throws(
      () => startOpenTelemetry({
        environment: {},
        sdkFactory: () => ({
          start: () => {
            throw new Error('vendor detail');
          },
          shutdown: async () => {},
        }),
      }),
      (error: unknown) => error instanceof OpenTelemetryError
        && error.code === OpenTelemetryErrorCodes.StartFailed,
    );
  });

  it('codes a shutdown failure without depending on its message', async () => {
    const telemetry = startOpenTelemetry({
      environment: {},
      sdkFactory: () => ({
        start: () => {},
        shutdown: async () => {
          throw new Error('vendor detail');
        },
      }),
    });

    await assert.rejects(
      telemetry.shutdown(),
      (error: unknown) => error instanceof OpenTelemetryError
        && error.code === OpenTelemetryErrorCodes.ShutdownFailed,
    );
  });
});
