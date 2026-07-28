import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  SystemClock,
  SystemClockError,
} from '.';

describe('SystemClock', () => {
  it('converte o tempo do sistema em Instant UTC', () => {
    const epochMilliseconds = Date.UTC(2026, 6, 28, 12, 0, 0);
    const clock = new SystemClock(() => epochMilliseconds);

    const instant = clock.now();

    assert.equal(
      instant.toISOString(),
      '2026-07-28T12:00:00.000Z',
    );
    assert.equal(
      instant.toEpochMilliseconds(),
      epochMilliseconds,
    );
  });

  it('classifica e preserva a causa de uma falha tecnica', () => {
    const clock = new SystemClock(() => Number.NaN);

    assert.throws(
      () => clock.now(),
      (error: unknown) => {
        assert.equal(error instanceof SystemClockError, true);

        if (!(error instanceof SystemClockError)) {
          return false;
        }

        assert.equal(error.name, 'SystemClockError');
        assert.equal(error.code, 'clock.system.failure');
        assert.equal(error.cause instanceof RangeError, true);

        return true;
      },
    );
  });
});
