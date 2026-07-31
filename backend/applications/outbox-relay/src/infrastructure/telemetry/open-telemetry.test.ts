import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  OpenTelemetryError,
  OpenTelemetryErrorCodes,
  startOpenTelemetry,
} from './open-telemetry';

describe('startOpenTelemetry', () => {
  it('does not construct the SDK when tracing is disabled', async () => {
    let constructed = false;
    const telemetry = startOpenTelemetry({
      environment: { OTEL_SDK_DISABLED: 'true' },
      sdkFactory: () => {
        constructed = true;
        return { start() {}, async shutdown() {} };
      },
    });

    await telemetry.shutdown();

    assert.equal(telemetry.enabled, false);
    assert.equal(constructed, false);
  });

  it('starts and shuts down the configured SDK', async () => {
    const calls: string[] = [];
    const telemetry = startOpenTelemetry({
      environment: {},
      sdkFactory: () => ({
        start: () => calls.push('start'),
        shutdown: async () => { calls.push('shutdown'); },
      }),
    });

    await telemetry.shutdown();

    assert.deepEqual(calls, ['start', 'shutdown']);
  });

  it('classifies startup and shutdown failures with stable codes', async () => {
    assert.throws(
      () => startOpenTelemetry({
        environment: {},
        sdkFactory: () => ({
          start: () => { throw new Error('startup details'); },
          async shutdown() {},
        }),
      }),
      (error: unknown) => error instanceof OpenTelemetryError
        && error.code === OpenTelemetryErrorCodes.StartFailed,
    );

    const telemetry = startOpenTelemetry({
      environment: {},
      sdkFactory: () => ({
        start() {},
        shutdown: async () => { throw new Error('shutdown details'); },
      }),
    });

    await assert.rejects(
      telemetry.shutdown(),
      (error: unknown) => error instanceof OpenTelemetryError
        && error.code === OpenTelemetryErrorCodes.ShutdownFailed,
    );
  });
});
