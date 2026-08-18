export const BffConfigErrorCodes = {
  AuthenticationIncomplete: 'bff.configuration.authentication.incomplete',
  GoogleOidcIncomplete: 'bff.configuration.google_oidc.incomplete',
  GoogleAuthenticationIncomplete: 'bff.configuration.google_authentication.incomplete',
  InvalidApiBaseUrl: 'bff.configuration.api_base_url.invalid',
  InvalidApiTimeout: 'bff.configuration.api_timeout.invalid',
  InvalidAuthenticationPrivateKey: 'bff.configuration.authentication_private_key.invalid',
  InvalidAuthenticationPrivateKeyFormat:
    'bff.configuration.authentication_private_key_format.invalid',
  InvalidPositiveInteger: 'bff.configuration.positive_integer.invalid',
  InvalidPort: 'bff.configuration.port.invalid',
} as const;

export type BffConfigErrorCode = (typeof BffConfigErrorCodes)[keyof typeof BffConfigErrorCodes];

export class BffConfigError extends Error {
  constructor(
    readonly code: BffConfigErrorCode,
    options?: ErrorOptions,
  ) {
    super(code, options);
    this.name = 'BffConfigError';
  }
}
