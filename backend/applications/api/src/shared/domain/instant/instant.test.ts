import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { Instant, InstantErrorCodes } from '.';

describe('Instant', () => {
  it('represents an absolute point in UTC without exposing Date', () => {
    const result = Instant.create('2026-07-27T15:00:00.000Z');

    assert.equal(result.success, true);

    if (!result.success) {
      return;
    }

    assert.equal(result.value.toISOString(), '2026-07-27T15:00:00.000Z');
    assert.equal(result.value.toEpochMilliseconds(), 1785164400000);
    assert.equal(result.value.toJSON(), '2026-07-27T15:00:00.000Z');
    assert.equal(Object.isFrozen(result.value), true);
  });

  it('compares instants by their represented absolute point', () => {
    const first = Instant.create('2026-07-27T15:00:00.000Z');
    const second = Instant.create('2026-07-27T15:00:00.000Z');

    assert.equal(first.success, true);
    assert.equal(second.success, true);

    if (!first.success || !second.success) {
      return;
    }

    assert.equal(first.value.equals(second.value), true);
  });

  it('rejects a non-string value', () => {
    const result = Instant.create(new Date());

    assert.deepEqual(result, {
      success: false,
      error: {
        code: InstantErrorCodes.InvalidType,
        field: 'instant',
      },
    });
  });

  it('rejects a civil date without an offset or zone', () => {
    const result = Instant.create('2026-07-27T15:00:00');

    assert.deepEqual(result, {
      success: false,
      error: {
        code: InstantErrorCodes.InvalidFormat,
        field: 'instant',
      },
    });
  });

  it('rejects an equivalent offset that is not normalized to UTC', () => {
    const result = Instant.create('2026-07-27T12:00:00-03:00');

    assert.deepEqual(result, {
      success: false,
      error: {
        code: InstantErrorCodes.InvalidFormat,
        field: 'instant',
      },
    });
  });
});
