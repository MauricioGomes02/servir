export const PostgresMinistryMembershipRequestFactsReaderErrorCode =
  'ministry_membership.request_facts.persistence_failed';

export class PostgresMinistryMembershipRequestFactsReaderError extends Error {
  readonly code = PostgresMinistryMembershipRequestFactsReaderErrorCode;
  constructor(cause: unknown) {
    super(PostgresMinistryMembershipRequestFactsReaderErrorCode, { cause });
    this.name = 'PostgresMinistryMembershipRequestFactsReaderError';
  }
}
