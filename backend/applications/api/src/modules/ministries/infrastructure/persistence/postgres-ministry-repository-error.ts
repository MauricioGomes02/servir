export const PostgresMinistryRepositoryErrorCode = 'postgres_ministry_repository.save_failed' as const;

export class PostgresMinistryRepositoryError extends Error {
  readonly code = PostgresMinistryRepositoryErrorCode;
  constructor(override readonly cause: unknown) {
    super(PostgresMinistryRepositoryErrorCode, { cause });
    this.name = 'PostgresMinistryRepositoryError';
  }
}
