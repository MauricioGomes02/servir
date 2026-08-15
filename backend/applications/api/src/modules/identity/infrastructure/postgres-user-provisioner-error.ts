export const PostgresUserProvisionerErrorCode = 'identity.user_provisioner.postgres_failure';

export class PostgresUserProvisionerError extends Error {
  readonly code = PostgresUserProvisionerErrorCode;

  constructor(cause: unknown) {
    super(PostgresUserProvisionerErrorCode, { cause });
    this.name = 'PostgresUserProvisionerError';
  }
}
