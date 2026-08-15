export const AuthenticationErrorCodes = {
  ExpiredAccessToken: 'authentication.access_token.expired',
  InvalidAccessToken: 'authentication.access_token.invalid',
  InvalidConfiguration: 'authentication.configuration.invalid',
  MissingAccessToken: 'authentication.access_token.missing',
} as const;

export type AuthenticationErrorCode =
  (typeof AuthenticationErrorCodes)[keyof typeof AuthenticationErrorCodes];

export interface AuthenticationError {
  readonly code: AuthenticationErrorCode;
}
