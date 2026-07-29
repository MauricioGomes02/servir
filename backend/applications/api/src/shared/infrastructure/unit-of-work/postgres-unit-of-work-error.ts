export const PostgresUnitOfWorkErrorCodes = {
  ConnectionAcquisitionFailed: 'postgres_unit_of_work.connection_acquisition_failed',
  BeginFailed: 'postgres_unit_of_work.begin_failed',
  CommitFailed: 'postgres_unit_of_work.commit_failed',
  RollbackFailed: 'postgres_unit_of_work.rollback_failed',
} as const;

export type PostgresUnitOfWorkErrorCode =
  (typeof PostgresUnitOfWorkErrorCodes)[keyof typeof PostgresUnitOfWorkErrorCodes];

export class PostgresUnitOfWorkError extends Error {
  constructor(
    readonly code: PostgresUnitOfWorkErrorCode,
    override readonly cause: unknown,
  ) {
    super(code, { cause });
    this.name = 'PostgresUnitOfWorkError';
  }
}
