import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createLogRecord, LogLevels } from '@servir/application-foundation';
import { JsonStdoutLogger } from './json-stdout-logger.js';

describe('JsonStdoutLogger', () => {
  it('writes correlated JSON Lines at or above the configured level', () => {
    const lines: string[] = [];
    const logger = new JsonStdoutLogger(
      (line) => lines.push(line),
      () => ({ traceId: '0af7651916cd43dd8448eb211c80319c', spanId: 'b7ad6b7169203331' }),
      LogLevels.Info,
    );

    logger.log(createLogRecord({ level: LogLevels.Debug, eventName: 'ignored', attributes: {} }));
    logger.log(
      createLogRecord({ level: LogLevels.Info, eventName: 'operation.completed', attributes: {} }),
    );

    assert.equal(lines.length, 1);
    assert.deepEqual(JSON.parse(lines[0] ?? '{}'), {
      level: 'info',
      eventName: 'operation.completed',
      attributes: {},
      traceId: '0af7651916cd43dd8448eb211c80319c',
      spanId: 'b7ad6b7169203331',
    });
  });

  it('does not propagate a destination failure', () => {
    const logger = new JsonStdoutLogger(() => {
      throw new Error('stdout unavailable');
    });
    assert.doesNotThrow(() =>
      logger.log(
        createLogRecord({
          level: LogLevels.Error,
          eventName: 'operation.failed',
          attributes: {},
        }),
      ),
    );
  });
});
