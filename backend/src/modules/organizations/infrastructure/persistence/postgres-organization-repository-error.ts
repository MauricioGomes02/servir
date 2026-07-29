export const PostgresOrganizationRepositoryErrorCode =
  'postgres_organization_repository.save_failed' as const;

export class PostgresOrganizationRepositoryError extends Error {
  readonly code = PostgresOrganizationRepositoryErrorCode;

  constructor(override readonly cause: unknown) {
    super(PostgresOrganizationRepositoryErrorCode, { cause });
    this.name = 'PostgresOrganizationRepositoryError';
  }
}
