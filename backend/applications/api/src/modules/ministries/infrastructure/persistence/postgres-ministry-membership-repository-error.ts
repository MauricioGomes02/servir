export const PostgresMinistryMembershipRepositoryErrorCodes = {
  AddFailed: 'ministries.ministry_membership_repository.add_failed',
  InvalidPersistedValue: 'ministries.ministry_membership_repository.invalid_persisted_value',
  MissingOnSave: 'ministries.ministry_membership_repository.missing_on_save',
  ReadFailed: 'ministries.ministry_membership_repository.read_failed',
  SaveFailed: 'ministries.ministry_membership_repository.save_failed',
  UntrackedOnSave: 'ministries.ministry_membership_repository.untracked_on_save',
} as const;

export type PostgresMinistryMembershipRepositoryErrorCode =
  (typeof PostgresMinistryMembershipRepositoryErrorCodes)[keyof typeof PostgresMinistryMembershipRepositoryErrorCodes];

export class PostgresMinistryMembershipRepositoryError extends Error {
  constructor(
    readonly code: PostgresMinistryMembershipRepositoryErrorCode,
    override readonly cause: unknown,
  ) {
    super(code, { cause });
    this.name = 'PostgresMinistryMembershipRepositoryError';
  }
}
