export const UnsupportedMemberStatusCodeErrorCode =
  'member_status_code.unsupported' as const;

export class UnsupportedMemberStatusCodeError extends Error {
  readonly code = UnsupportedMemberStatusCodeErrorCode;

  constructor(readonly statusCode: unknown) {
    super(UnsupportedMemberStatusCodeErrorCode);
    this.name = 'UnsupportedMemberStatusCodeError';
  }
}
