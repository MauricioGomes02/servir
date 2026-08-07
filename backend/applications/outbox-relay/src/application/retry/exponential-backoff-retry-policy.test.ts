import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Clock, RandomSource } from '@/application/ports';
import { RetryPolicyConfigError, RetryPolicyConfigErrorCodes } from '@/application/errors';

import { ExponentialBackoffRetryPolicy } from './exponential-backoff-retry-policy';

const FAILED_AT = '2026-07-29T15:00:00.000Z';

class RecordingClock implements Clock {
  readonly delays: number[] = [];

  now(): string {
    return FAILED_AT;
  }

  after(instant: string, milliseconds: number): string {
    this.delays.push(milliseconds);
    return `${instant}+${milliseconds}`;
  }
}

class FixedRandomSource implements RandomSource {
  constructor(private readonly value: number) {}

  next(): number {
    return this.value;
  }
}

function policy(
  input: Readonly<{
    randomValue?: number;
    maximumAttempts?: number;
    baseDelayMilliseconds?: number;
    maximumDelayMilliseconds?: number;
    jitterRatio?: number;
  }> = {},
) {
  const clock = new RecordingClock();

  return {
    clock,
    retryPolicy: new ExponentialBackoffRetryPolicy(
      clock,
      new FixedRandomSource(input.randomValue ?? 0.5),
      {
        maximumAttempts: input.maximumAttempts ?? 5,
        baseDelayMilliseconds: input.baseDelayMilliseconds ?? 1_000,
        maximumDelayMilliseconds: input.maximumDelayMilliseconds ?? 30_000,
        jitterRatio: input.jitterRatio ?? 0.2,
      },
    ),
  };
}

function failure(attemptCount: number, retryable = true) {
  return {
    attemptCount,
    failedAt: FAILED_AT,
    errorCode: 'kafka.unavailable',
    retryable,
  } as const;
}

describe('ExponentialBackoffRetryPolicy', () => {
  it('doubles the delay after each failed attempt', () => {
    const { clock, retryPolicy } = policy({ jitterRatio: 0 });

    retryPolicy.decide(failure(1));
    retryPolicy.decide(failure(2));
    retryPolicy.decide(failure(3));

    assert.deepEqual(clock.delays, [1_000, 2_000, 4_000]);
  });

  it('keeps the retry delay within the configured jitter range', () => {
    const minimum = policy({ randomValue: 0 });
    const maximum = policy({ randomValue: 0.999_999 });

    minimum.retryPolicy.decide(failure(1));
    maximum.retryPolicy.decide(failure(1));

    assert.deepEqual(minimum.clock.delays, [800]);
    assert.deepEqual(maximum.clock.delays, [1_200]);
  });

  it('never schedules beyond the maximum delay', () => {
    const { clock, retryPolicy } = policy({
      randomValue: 0.999_999,
      maximumAttempts: 20,
      maximumDelayMilliseconds: 5_000,
    });

    retryPolicy.decide(failure(10));

    assert.deepEqual(clock.delays, [5_000]);
  });

  it('stops immediately for a non-retryable failure', () => {
    const { clock, retryPolicy } = policy();

    const decision = retryPolicy.decide(failure(1, false));

    assert.deepEqual(decision, { retry: false });
    assert.deepEqual(clock.delays, []);
  });

  it('stops when the maximum attempt is reached', () => {
    const { clock, retryPolicy } = policy({ maximumAttempts: 3 });

    assert.equal(retryPolicy.decide(failure(2)).retry, true);
    assert.deepEqual(retryPolicy.decide(failure(3)), { retry: false });
    assert.deepEqual(clock.delays, [2_000]);
  });

  it('rejects invalid configuration values with stable codes', () => {
    const invalidConfigurations = [
      {
        values: { maximumAttempts: 0 },
        code: RetryPolicyConfigErrorCodes.InvalidMaximumAttempts,
      },
      {
        values: { baseDelayMilliseconds: 0 },
        code: RetryPolicyConfigErrorCodes.InvalidBaseDelay,
      },
      {
        values: { maximumDelayMilliseconds: 999 },
        code: RetryPolicyConfigErrorCodes.InvalidMaximumDelay,
      },
      {
        values: { jitterRatio: 1.1 },
        code: RetryPolicyConfigErrorCodes.InvalidJitterRatio,
      },
    ] as const;

    for (const invalid of invalidConfigurations) {
      assert.throws(
        () => policy(invalid.values),
        (error: unknown) => error instanceof RetryPolicyConfigError && error.code === invalid.code,
      );
    }
  });

  it('rejects random values outside the RandomSource contract', () => {
    for (const randomValue of [-0.01, 1, Number.NaN]) {
      const { retryPolicy } = policy({ randomValue });

      assert.throws(
        () => retryPolicy.decide(failure(1)),
        (error: unknown) =>
          error instanceof RetryPolicyConfigError &&
          error.code === RetryPolicyConfigErrorCodes.InvalidRandomValue,
      );
    }
  });
});
