import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ROOT_CONTEXT, SpanStatusCode, trace } from '@opentelemetry/api';

import {
  createPgInstrumentation,
  OpenTelemetryError,
  OpenTelemetryErrorCodes,
  runInSpan,
  startOpenTelemetry,
} from './open-telemetry.js';

describe('createPgInstrumentation', () => {
  it('keeps enhanced database reporting disabled', () => {
    const instrumentation = createPgInstrumentation();

    assert.equal(instrumentation.getConfig().enhancedDatabaseReporting, false);
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

  it('passes instrumentations to the SDK and controls its lifecycle', async () => {
    const calls: string[] = [];
    const instrumentations = [createPgInstrumentation()];
    const telemetry = startOpenTelemetry({
      environment: {},
      instrumentations,
      sdkFactory: (received) => {
        assert.equal(received, instrumentations);
        return {
          start: () => calls.push('start'),
          shutdown: async () => { calls.push('shutdown'); },
        };
      },
    });

    await telemetry.shutdown();

    assert.equal(telemetry.enabled, true);
    assert.deepEqual(calls, ['start', 'shutdown']);
  });

  it('classifies lifecycle failures with stable codes', async () => {
    assert.throws(
      () => startOpenTelemetry({
        environment: {},
        sdkFactory: () => ({
          start: () => { throw new Error('startup details'); },
          shutdown: async () => {},
        }),
      }),
      (error: unknown) => error instanceof OpenTelemetryError
        && error.code === OpenTelemetryErrorCodes.StartFailed,
    );

    const telemetry = startOpenTelemetry({
      environment: {},
      sdkFactory: () => ({
        start: () => {},
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

describe('runInSpan', () => {
  it('returns the operation result and ends the span', async () => {
    let ended = false;
    const tracer = {
      startActiveSpan: async (...args: unknown[]) => {
        const operation = args.at(-1) as (span: object) => Promise<string>;
        return operation({
          end: () => { ended = true; },
          recordException: () => {},
          setStatus: () => {},
        });
      },
    } as unknown as ReturnType<typeof trace.getTracer>;

    const result = await runInSpan(
      tracer,
      'operation',
      ROOT_CONTEXT,
      {},
      async () => 'completed',
    );

    assert.equal(result, 'completed');
    assert.equal(ended, true);
  });

  it('records and rethrows operation failures before ending the span', async () => {
    const failure = new Error('operation failed');
    const recorded: unknown[] = [];
    const statuses: unknown[] = [];
    let ended = false;
    const tracer = {
      startActiveSpan: async (...args: unknown[]) => {
        const operation = args.at(-1) as (span: object) => Promise<never>;
        return operation({
          end: () => { ended = true; },
          recordException: (error: unknown) => recorded.push(error),
          setStatus: (status: unknown) => statuses.push(status),
        });
      },
    } as unknown as ReturnType<typeof trace.getTracer>;

    await assert.rejects(
      runInSpan(tracer, 'operation', ROOT_CONTEXT, {}, async () => {
        throw failure;
      }),
      failure,
    );

    assert.deepEqual(recorded, [failure]);
    assert.deepEqual(statuses, [{ code: SpanStatusCode.ERROR }]);
    assert.equal(ended, true);
  });
});
