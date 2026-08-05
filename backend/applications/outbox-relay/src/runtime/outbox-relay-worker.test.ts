import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Clock } from '@/application';
import type { Logger, LogRecord } from '@servir/application-foundation';

import { OutboxRelayWorker } from './outbox-relay-worker';

const clock: Clock = {
  now: () => '2026-07-31T15:00:00.000Z',
  after: () => '2026-07-31T15:01:00.000Z',
};

function logger(records: LogRecord[]): Logger {
  return { log: (record) => records.push(record) };
}

describe('OutboxRelayWorker', () => {
  it('continues immediately while every claimed batch reaches the limit', async () => {
    const controller = new AbortController();
    const delays: number[] = [];
    let executions = 0;
    const worker = new OutboxRelayWorker({
      batchSize: 2,
      pollIntervalMilliseconds: 1_000,
      clock,
      logger: logger([]),
      batchProcessor: {
        async execute() {
          executions += 1;

          if (executions === 2) {
            controller.abort();
          }

          return { claimed: 2, published: 2, rescheduled: 0, failed: 0 };
        },
      },
      delay: async (milliseconds) => { delays.push(milliseconds); },
    });

    await worker.run(controller.signal);

    assert.equal(executions, 2);
    assert.deepEqual(delays, []);
  });

  it('waits after a partial batch and stops when the signal is aborted', async () => {
    const controller = new AbortController();
    const delays: number[] = [];
    const worker = new OutboxRelayWorker({
      batchSize: 10,
      pollIntervalMilliseconds: 750,
      clock,
      logger: logger([]),
      batchProcessor: {
        async execute() {
          return { claimed: 1, published: 1, rescheduled: 0, failed: 0 };
        },
      },
      delay: async (milliseconds) => {
        delays.push(milliseconds);
        controller.abort();
      },
    });

    await worker.run(controller.signal);

    assert.deepEqual(delays, [750]);
  });

  it('logs a stable failure code and retries after the polling interval', async () => {
    const controller = new AbortController();
    const records: LogRecord[] = [];
    let executions = 0;
    const worker = new OutboxRelayWorker({
      batchSize: 10,
      pollIntervalMilliseconds: 1_000,
      clock,
      logger: logger(records),
      batchProcessor: {
        async execute() {
          executions += 1;

          if (executions === 1) {
            throw Object.assign(new Error('sensitive details'), {
              code: 'outbox.claim_failed',
            });
          }

          controller.abort();
          return { claimed: 0, published: 0, rescheduled: 0, failed: 0 };
        },
      },
      delay: async () => {},
    });

    await worker.run(controller.signal);

    assert.equal(executions, 2);
    assert.deepEqual(records, [{
      occurredAt: '2026-07-31T15:00:00.000Z',
      level: 'error',
      eventName: 'outbox.relay.cycle.failed',
      context: undefined,
      attributes: { 'error.code': 'outbox.claim_failed' },
    }]);
    assert.equal(JSON.stringify(records).includes('sensitive details'), false);
  });
});
