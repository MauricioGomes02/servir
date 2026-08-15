export const AuthenticatedActorErrorCodes = {
  InvalidType: 'authentication.actor.invalid_type',
  Empty: 'authentication.actor.empty',
  TooLong: 'authentication.actor.too_long',
} as const;

export type AuthenticatedActorErrorCode =
  (typeof AuthenticatedActorErrorCodes)[keyof typeof AuthenticatedActorErrorCodes];

export interface AuthenticatedActorError {
  readonly code: AuthenticatedActorErrorCode;
  readonly field: 'issuer' | 'subject';
  readonly params?: Readonly<Record<string, string | number>>;
}
