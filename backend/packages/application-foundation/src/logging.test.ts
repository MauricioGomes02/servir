import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createLogRecord, LogLevels } from './logging.js';

describe('LogRecord', () => {
  it('creates an immutable structured occurrence without sharing nested values', () => {
    const attributes = { result: { codes: ['accepted'] } };
    const record = createLogRecord({
      level: LogLevels.Info,
      eventName: 'operation.completed',
      context: { correlationId: 'correlation-123' },
      attributes,
    });

    attributes.result.codes.push('changed');

    assert.deepEqual(record.attributes, { result: { codes: ['accepted'] } });
    assert.equal(Object.isFrozen(record), true);
    assert.equal(Object.isFrozen(record.context), true);
  });
});
