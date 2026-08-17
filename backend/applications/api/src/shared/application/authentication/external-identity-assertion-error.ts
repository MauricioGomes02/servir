export const ExternalIdentityAssertionErrorCodes = {
  Empty: 'authentication.external_identity_assertion.empty',
  InvalidType: 'authentication.external_identity_assertion.invalid_type',
  TooLong: 'authentication.external_identity_assertion.too_long',
} as const;

export type ExternalIdentityAssertionErrorCode =
  (typeof ExternalIdentityAssertionErrorCodes)[keyof typeof ExternalIdentityAssertionErrorCodes];

export interface ExternalIdentityAssertionError {
  readonly code: ExternalIdentityAssertionErrorCode;
  readonly field: 'issuer' | 'subject';
  readonly params?: Readonly<Record<string, string | number>>;
}
