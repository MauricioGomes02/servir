export const PostgresEventOutboxErrorCode = 'postgres_event_outbox.add_failed' as const;

export class PostgresEventOutboxError extends Error {
  readonly code = PostgresEventOutboxErrorCode;

  constructor(override readonly cause: unknown) {
    super(PostgresEventOutboxErrorCode, { cause });
    this.name = 'PostgresEventOutboxError';
  }
}
