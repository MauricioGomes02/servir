import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { Instant } from '@/shared/domain/instant';

import { FixedClock } from '.';

describe('FixedClock', () => {
  it('always returns the configured instant', () => {
    const instant = Instant.create('2026-07-28T12:00:00.000Z');

    assert.equal(instant.success, true);

    if (!instant.success) {
      return;
    }

    const clock = new FixedClock(instant.value);

    assert.equal(clock.now(), instant.value);
    assert.equal(clock.now(), instant.value);
  });
});
