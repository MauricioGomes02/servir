export const AuthenticatedActorErrorCodes = {
  Empty: 'authentication.actor.user_id.empty',
  InvalidFormat: 'authentication.actor.user_id.invalid_format',
  InvalidType: 'authentication.actor.user_id.invalid_type',
} as const;

export type AuthenticatedActorErrorCode =
  (typeof AuthenticatedActorErrorCodes)[keyof typeof AuthenticatedActorErrorCodes];

export interface AuthenticatedActorError {
  readonly code: AuthenticatedActorErrorCode;
  readonly field: 'userId';
}
