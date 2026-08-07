import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { SystemClock, SystemClockError } from './system-clock';

describe('SystemClock', () => {
  it('represents current and derived instants in UTC', () => {
    const clock = new SystemClock(() => Date.parse('2026-07-31T15:00:00.000Z'));

    assert.equal(clock.now(), '2026-07-31T15:00:00.000Z');
    assert.equal(clock.after('2026-07-31T15:00:00.000Z', 60_000), '2026-07-31T15:01:00.000Z');
  });

  it('classifies an invalid system time without exposing its message', () => {
    assert.throws(
      () => new SystemClock(() => Number.NaN).now(),
      (error: unknown) =>
        error instanceof SystemClockError && error.message === 'clock.system.failed',
    );
  });
});
