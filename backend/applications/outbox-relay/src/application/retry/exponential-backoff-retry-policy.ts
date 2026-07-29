import {
  RetryPolicyConfigError,
  RetryPolicyConfigErrorCodes,
} from '@/application/errors';
import type {
  Clock,
  RandomSource,
  RetryDecision,
  RetryPolicy,
} from '@/application/ports';

export interface ExponentialBackoffRetryPolicyConfig {
  readonly maximumAttempts: number;
  readonly baseDelayMilliseconds: number;
  readonly maximumDelayMilliseconds: number;
  readonly jitterRatio: number;
}

export class ExponentialBackoffRetryPolicy implements RetryPolicy {
  constructor(
    private readonly clock: Clock,
    private readonly randomSource: RandomSource,
    private readonly config: ExponentialBackoffRetryPolicyConfig,
  ) {
    validateConfig(config);
  }

  decide(input: Readonly<{
    attemptCount: number;
    failedAt: string;
    errorCode: string;
    retryable: boolean;
  }>): RetryDecision {
    if (!input.retryable || input.attemptCount >= this.config.maximumAttempts) {
      return Object.freeze({ retry: false });
    }

    const randomValue = this.randomSource.next();

    if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
      throw new RetryPolicyConfigError(
        RetryPolicyConfigErrorCodes.InvalidRandomValue,
      );
    }

    const exponentialDelay = this.config.baseDelayMilliseconds
      * (2 ** Math.max(0, input.attemptCount - 1));
    const boundedDelay = Math.min(
      exponentialDelay,
      this.config.maximumDelayMilliseconds,
    );
    const jitterFactor = 1 - this.config.jitterRatio
      + (2 * this.config.jitterRatio * randomValue);
    const delay = Math.min(
      this.config.maximumDelayMilliseconds,
      Math.max(0, Math.round(boundedDelay * jitterFactor)),
    );

    return Object.freeze({
      retry: true,
      availableAt: this.clock.after(input.failedAt, delay),
    });
  }
}

function validateConfig(config: ExponentialBackoffRetryPolicyConfig): void {
  if (!Number.isInteger(config.maximumAttempts) || config.maximumAttempts <= 0) {
    throw new RetryPolicyConfigError(
      RetryPolicyConfigErrorCodes.InvalidMaximumAttempts,
    );
  }

  if (
    !Number.isInteger(config.baseDelayMilliseconds)
    || config.baseDelayMilliseconds <= 0
  ) {
    throw new RetryPolicyConfigError(
      RetryPolicyConfigErrorCodes.InvalidBaseDelay,
    );
  }

  if (
    !Number.isInteger(config.maximumDelayMilliseconds)
    || config.maximumDelayMilliseconds < config.baseDelayMilliseconds
  ) {
    throw new RetryPolicyConfigError(
      RetryPolicyConfigErrorCodes.InvalidMaximumDelay,
    );
  }

  if (
    !Number.isFinite(config.jitterRatio)
    || config.jitterRatio < 0
    || config.jitterRatio > 1
  ) {
    throw new RetryPolicyConfigError(
      RetryPolicyConfigErrorCodes.InvalidJitterRatio,
    );
  }
}
