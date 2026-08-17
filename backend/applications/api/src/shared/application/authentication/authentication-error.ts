export const AuthenticationErrorCodes = {
  ExpiredBootstrapAssertion: 'authentication.bootstrap_assertion.expired',
  ExpiredAccessToken: 'authentication.access_token.expired',
  InvalidBootstrapAssertion: 'authentication.bootstrap_assertion.invalid',
  InvalidAccessToken: 'authentication.access_token.invalid',
  InvalidConfiguration: 'authentication.configuration.invalid',
  MissingAccessToken: 'authentication.access_token.missing',
} as const;

export type AuthenticationErrorCode =
  (typeof AuthenticationErrorCodes)[keyof typeof AuthenticationErrorCodes];

export interface AuthenticationError {
  readonly code: AuthenticationErrorCode;
}
