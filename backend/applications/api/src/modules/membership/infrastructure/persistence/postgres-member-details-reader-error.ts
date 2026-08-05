export const PostgresMemberDetailsReaderErrorCode =
  'postgres_member_details_reader.read_failed' as const;

export class PostgresMemberDetailsReaderError extends Error {
  readonly code = PostgresMemberDetailsReaderErrorCode;

  constructor(override readonly cause: unknown) {
    super(PostgresMemberDetailsReaderErrorCode, { cause });
    this.name = 'PostgresMemberDetailsReaderError';
  }
}
