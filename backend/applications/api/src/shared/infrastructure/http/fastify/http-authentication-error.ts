import {
  AuthenticationErrorCodes,
  type AuthenticationErrorCode,
} from '@/shared/application/authentication';

export class HttpAuthenticationError extends Error {
  readonly statusCode = 401;

  constructor(readonly code: AuthenticationErrorCode) {
    super(code);
    this.name = 'HttpAuthenticationError';
  }

  static missingAccessToken(): HttpAuthenticationError {
    return new HttpAuthenticationError(AuthenticationErrorCodes.MissingAccessToken);
  }
}
