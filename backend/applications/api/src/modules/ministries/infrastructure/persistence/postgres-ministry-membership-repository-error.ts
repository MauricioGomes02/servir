export const PostgresMinistryMembershipRepositoryErrorCode =
  'ministry_membership.persistence.failed';

export class PostgresMinistryMembershipRepositoryError extends Error {
  readonly code = PostgresMinistryMembershipRepositoryErrorCode;
  constructor(cause: unknown) {
    super(PostgresMinistryMembershipRepositoryErrorCode, { cause });
    this.name = 'PostgresMinistryMembershipRepositoryError';
  }
}
