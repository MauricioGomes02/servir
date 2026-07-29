export const RetryPolicyConfigErrorCodes = Object.freeze({
  InvalidMaximumAttempts: 'outbox_relay.retry.invalid_maximum_attempts',
  InvalidBaseDelay: 'outbox_relay.retry.invalid_base_delay',
  InvalidMaximumDelay: 'outbox_relay.retry.invalid_maximum_delay',
  InvalidJitterRatio: 'outbox_relay.retry.invalid_jitter_ratio',
  InvalidRandomValue: 'outbox_relay.retry.invalid_random_value',
} as const);

export type RetryPolicyConfigErrorCode =
  typeof RetryPolicyConfigErrorCodes[
    keyof typeof RetryPolicyConfigErrorCodes
  ];

export class RetryPolicyConfigError extends Error {
  constructor(readonly code: RetryPolicyConfigErrorCode) {
    super(code);
    this.name = 'RetryPolicyConfigError';
  }
}
