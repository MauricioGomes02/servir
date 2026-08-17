import { failure, success, type Result } from '@/shared/core/result';
import { isCanonicalUuid } from '@/shared/core/uuid';

import {
  AuthenticatedActorErrorCodes,
  type AuthenticatedActorError,
} from './authenticated-actor-error';

declare const authenticatedUserIdBrand: unique symbol;

export type AuthenticatedUserId = string & {
  readonly [authenticatedUserIdBrand]: 'AuthenticatedUserId';
};

export interface AuthenticatedActor {
  readonly userId: AuthenticatedUserId;
}

export function parseAuthenticatedUserId(
  input: unknown,
): Result<AuthenticatedUserId, AuthenticatedActorError> {
  if (typeof input !== 'string') {
    return failure({
      code: AuthenticatedActorErrorCodes.InvalidType,
      field: 'userId',
    });
  }

  const value = input.trim();

  if (value.length === 0) {
    return failure({ code: AuthenticatedActorErrorCodes.Empty, field: 'userId' });
  }

  if (!isCanonicalUuid(value)) {
    return failure({
      code: AuthenticatedActorErrorCodes.InvalidFormat,
      field: 'userId',
    });
  }

  return success(value.toLowerCase() as AuthenticatedUserId);
}

export function createAuthenticatedActor(userId: AuthenticatedUserId): AuthenticatedActor {
  return Object.freeze({ userId });
}
