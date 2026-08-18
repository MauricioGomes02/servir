export const BffAuthenticationErrorCodes = {
  AccessTokenIssueFailed: 'identity.access_token.issue_failed',
  CallbackInvalid: 'identity.oidc.callback_invalid',
  CookieEncryptionKeyInvalid: 'identity.cookie.encryption_key.invalid',
  CsrfInvalid: 'identity.csrf.invalid',
  LoginTransactionInvalid: 'identity.oidc.login_transaction.invalid',
  LoginTransactionRequired: 'identity.oidc.login_transaction.required',
  ProviderResponseInvalid: 'identity.oidc.provider_response.invalid',
  ProvisioningFailed: 'identity.user.provisioning.failed',
  ProvisioningResponseInvalid: 'identity.user.provisioning_response.invalid',
  SessionInvalid: 'identity.session.invalid',
  SessionRequired: 'identity.session.required',
  SigningKeyInvalid: 'identity.signing_key.invalid',
  VerificationKeyInvalid: 'identity.verification_key.invalid',
} as const;

export type BffAuthenticationErrorCode =
  (typeof BffAuthenticationErrorCodes)[keyof typeof BffAuthenticationErrorCodes];

export class BffAuthenticationError extends Error {
  constructor(
    readonly code: BffAuthenticationErrorCode,
    options?: ErrorOptions,
  ) {
    super(code, options);
    this.name = 'BffAuthenticationError';
  }
}
