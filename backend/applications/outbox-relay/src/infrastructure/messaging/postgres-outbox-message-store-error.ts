export const PostgresOutboxMessageStoreErrorCodes = Object.freeze({
  ClaimFailed: 'postgres_outbox_message_store.claim_failed',
  MarkPublishedFailed: 'postgres_outbox_message_store.mark_published_failed',
  RescheduleFailed: 'postgres_outbox_message_store.reschedule_failed',
  MarkFailedFailed: 'postgres_outbox_message_store.mark_failed_failed',
  InvalidRow: 'postgres_outbox_message_store.invalid_row',
} as const);

export type PostgresOutboxMessageStoreErrorCode =
  (typeof PostgresOutboxMessageStoreErrorCodes)[keyof typeof PostgresOutboxMessageStoreErrorCodes];

export class PostgresOutboxMessageStoreError extends Error {
  constructor(
    readonly code: PostgresOutboxMessageStoreErrorCode,
    override readonly cause?: unknown,
  ) {
    super(code, cause === undefined ? undefined : { cause });
    this.name = 'PostgresOutboxMessageStoreError';
  }
}
