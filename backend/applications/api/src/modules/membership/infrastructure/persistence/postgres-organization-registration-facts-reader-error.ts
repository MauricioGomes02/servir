export const PostgresOrganizationRegistrationFactsReaderErrorCode =
  'postgres_organization_registration_facts_reader.read_failed' as const;

export class PostgresOrganizationRegistrationFactsReaderError extends Error {
  readonly code = PostgresOrganizationRegistrationFactsReaderErrorCode;

  constructor(override readonly cause: unknown) {
    super(PostgresOrganizationRegistrationFactsReaderErrorCode, { cause });
    this.name = 'PostgresOrganizationRegistrationFactsReaderError';
  }
}
