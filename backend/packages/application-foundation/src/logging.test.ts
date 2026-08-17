import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createLogRecord, LogLevels, parseLogLevel } from './logging.js';

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

  it('keeps authentication data outside the observable log context', () => {
    const context = {
      correlationId: 'correlation-123',
      actor: { userId: 'user-123' },
      externalIdentityAssertion: {
        issuer: 'https://identity.example.com',
        subject: 'provider-subject',
      },
    };

    const record = createLogRecord({
      level: LogLevels.Info,
      eventName: 'identity.user.provisioned',
      context,
      attributes: {},
    });

    assert.deepEqual(record.context, { correlationId: 'correlation-123' });
  });
});

describe('parseLogLevel', () => {
  it('uses the configured fallback when input is absent', () => {
    assert.equal(parseLogLevel(undefined), LogLevels.Info);
    assert.equal(parseLogLevel(undefined, LogLevels.Warn), LogLevels.Warn);
  });

  it('normalizes every supported severity', () => {
    for (const level of Object.values(LogLevels)) {
      assert.equal(parseLogLevel(` ${level.toUpperCase()} `), level);
    }
  });

  it('rejects unsupported and non-string inputs', () => {
    for (const input of ['', 'verbose', null, 1]) {
      assert.equal(parseLogLevel(input), undefined);
    }
  });
});
