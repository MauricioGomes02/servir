export const PostgresMinistryRepositoryErrorCodes = {
  AddFailed: 'ministries.ministry_repository.add_failed',
  InvalidPersistedValue: 'ministries.ministry_repository.invalid_persisted_value',
  MissingOnSave: 'ministries.ministry_repository.missing_on_save',
  ReadFailed: 'ministries.ministry_repository.read_failed',
  SaveFailed: 'ministries.ministry_repository.save_failed',
  UntrackedOnSave: 'ministries.ministry_repository.untracked_on_save',
} as const;

export type PostgresMinistryRepositoryErrorCode =
  (typeof PostgresMinistryRepositoryErrorCodes)[keyof typeof PostgresMinistryRepositoryErrorCodes];

export class PostgresMinistryRepositoryError extends Error {
  constructor(
    readonly code: PostgresMinistryRepositoryErrorCode,
    override readonly cause: unknown,
  ) {
    super(code, { cause });
    this.name = 'PostgresMinistryRepositoryError';
  }
}
