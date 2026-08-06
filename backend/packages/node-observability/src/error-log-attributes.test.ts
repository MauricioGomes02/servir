import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createErrorLogAttributes } from './error-log-attributes.js';

describe('createErrorLogAttributes', () => {
  it('describes a coded error without exposing technical details by default', () => {
    const error = Object.assign(new Error('database password exposed'), {
      code: 'database.connection.failed',
    });

    assert.deepEqual(createErrorLogAttributes(error, {
      fallbackCode: 'service.failed',
    }), {
      'error.type': 'Error',
      'error.code': 'database.connection.failed',
    });
  });

  it('uses the application fallback for unknown failures', () => {
    assert.deepEqual(createErrorLogAttributes('failure', {
      fallbackCode: 'service.failed',
    }), {
      'error.type': 'string',
      'error.code': 'service.failed',
    });
  });

  it('includes message and stack only when explicitly enabled', () => {
    const attributes = createErrorLogAttributes(new Error('driver details'), {
      fallbackCode: 'service.failed',
      includeDetails: true,
    });

    assert.equal(attributes['exception.message'], 'driver details');
    assert.equal(typeof attributes['exception.stacktrace'], 'string');
  });
});
