export const InvalidPersistedMemberDetailsErrorCode =
  'persisted_member_details.invalid' as const;

export class InvalidPersistedMemberDetailsError extends Error {
  readonly code = InvalidPersistedMemberDetailsErrorCode;

  constructor(readonly field: string) {
    super(InvalidPersistedMemberDetailsErrorCode);
    this.name = 'InvalidPersistedMemberDetailsError';
  }
}
