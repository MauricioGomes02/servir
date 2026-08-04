export const PostgresMemberRepositoryErrorCode =
  'postgres_member_repository.save_failed' as const;

export class PostgresMemberRepositoryError extends Error {
  readonly code = PostgresMemberRepositoryErrorCode;

  constructor(override readonly cause: unknown) {
    super(PostgresMemberRepositoryErrorCode, { cause });
    this.name = 'PostgresMemberRepositoryError';
  }
}
