export const PostgresMinistryCreationFactsReaderErrorCode =
  'postgres_ministry_creation_facts_reader.read_failed' as const;

export class PostgresMinistryCreationFactsReaderError extends Error {
  readonly code = PostgresMinistryCreationFactsReaderErrorCode;
  constructor(override readonly cause: unknown) {
    super(PostgresMinistryCreationFactsReaderErrorCode, { cause });
    this.name = 'PostgresMinistryCreationFactsReaderError';
  }
}
