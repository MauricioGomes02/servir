import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { failure, success } from '.';

describe('Result', () => {
  it('represents success as an immutable exclusive branch', () => {
    const result = success('organization-123');

    assert.deepEqual(result, {
      success: true,
      value: 'organization-123',
    });
    assert.equal(Object.isFrozen(result), true);
    assert.equal('error' in result, false);
  });

  it('deeply copies and freezes a structured error', () => {
    const error = {
      code: 'organization.name.max_length',
      params: {
        maxLength: 120,
      },
    };

    const result = failure(error);
    error.params.maxLength = 240;

    assert.deepEqual(result.error, {
      code: 'organization.name.max_length',
      params: {
        maxLength: 120,
      },
    });
    assert.equal(Object.isFrozen(result), true);
    assert.equal(Object.isFrozen(result.error), true);
    assert.equal(Object.isFrozen(result.error.params), true);
    assert.equal('value' in result, false);
  });
});
