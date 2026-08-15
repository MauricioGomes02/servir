import type { AuthenticatedActor } from '@/shared/application/authentication';
import type { ExecutionContext } from '@/shared/application/context';

import { HttpAuthenticationError } from './http-authentication-error';

export function requireAuthenticatedActor(context: ExecutionContext): AuthenticatedActor {
  if (context.actor === undefined) throw HttpAuthenticationError.missingAccessToken();

  return context.actor;
}
