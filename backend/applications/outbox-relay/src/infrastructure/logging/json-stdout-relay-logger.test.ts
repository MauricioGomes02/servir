import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { JsonStdoutRelayLogger } from './json-stdout-relay-logger';

describe('JsonStdoutRelayLogger', () => {
  it('writes one structured record per call', () => {
    const lines: string[] = [];
    const logger = new JsonStdoutRelayLogger((line) => lines.push(line));

    logger.log({
      timestamp: '2026-07-31T15:00:00.000Z',
      severity: 'info',
      name: 'outbox.relay.started',
      attributes: { topic: 'servir.organizations.events' },
    });

    assert.equal(lines.length, 1);
    assert.deepEqual(JSON.parse(lines[0] ?? '{}'), {
      timestamp: '2026-07-31T15:00:00.000Z',
      severity: 'info',
      name: 'outbox.relay.started',
      attributes: { topic: 'servir.organizations.events' },
    });
  });

  it('does not propagate a destination failure', () => {
    const logger = new JsonStdoutRelayLogger(() => {
      throw new Error('destination unavailable');
    });

    assert.doesNotThrow(() => logger.log({
      timestamp: '2026-07-31T15:00:00.000Z',
      severity: 'error',
      name: 'outbox.relay.cycle.failed',
    }));
  });

  it('adds the active trace and span identities without changing the record', () => {
    const lines: string[] = [];
    const logger = new JsonStdoutRelayLogger(
      (line) => lines.push(line),
      () => ({
        traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
        spanId: '00f067aa0ba902b7',
        traceFlags: 1,
      }),
    );

    logger.log({
      timestamp: '2026-07-31T15:00:00.000Z',
      severity: 'info',
      name: 'outbox.relay.batch.completed',
    });

    assert.deepEqual(JSON.parse(lines[0] ?? '{}'), {
      timestamp: '2026-07-31T15:00:00.000Z',
      severity: 'info',
      name: 'outbox.relay.batch.completed',
      traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
      spanId: '00f067aa0ba902b7',
    });
  });
});
