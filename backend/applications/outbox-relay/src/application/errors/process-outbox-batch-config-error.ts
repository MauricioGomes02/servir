export const ProcessOutboxBatchConfigErrorCodes = Object.freeze({
  InvalidBatchSize: 'outbox_relay.invalid_batch_size',
  InvalidLeaseDuration: 'outbox_relay.invalid_lease_duration',
} as const);

export type ProcessOutboxBatchConfigErrorCode =
  (typeof ProcessOutboxBatchConfigErrorCodes)[keyof typeof ProcessOutboxBatchConfigErrorCodes];

export class ProcessOutboxBatchConfigError extends Error {
  constructor(readonly code: ProcessOutboxBatchConfigErrorCode) {
    super(code);
    this.name = 'ProcessOutboxBatchConfigError';
  }
}
