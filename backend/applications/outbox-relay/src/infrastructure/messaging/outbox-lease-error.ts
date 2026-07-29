export const OutboxLeaseErrorCodes = Object.freeze({
  NotOwned: 'outbox_message.lease_not_owned',
  Expired: 'outbox_message.lease_expired',
} as const);

export type OutboxLeaseErrorCode =
  typeof OutboxLeaseErrorCodes[keyof typeof OutboxLeaseErrorCodes];

export class OutboxLeaseError extends Error {
  constructor(readonly code: OutboxLeaseErrorCode) {
    super(code);
    this.name = 'OutboxLeaseError';
  }
}
