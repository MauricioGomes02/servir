import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  OpenTelemetryError,
  OpenTelemetryErrorCodes,
  startOpenTelemetry,
} from './open-telemetry';

describe('startOpenTelemetry', () => {
  it('nao cria o SDK quando a telemetria esta desabilitada', async () => {
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

  it('inicia e encerra o SDK configurado', async () => {
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

  it('codifica uma falha de inicializacao sem depender da mensagem', () => {
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

  it('codifica uma falha de encerramento sem depender da mensagem', async () => {
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
