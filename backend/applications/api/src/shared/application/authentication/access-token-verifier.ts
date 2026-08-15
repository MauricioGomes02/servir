import type { Result } from '@/shared/core/result';

import type { AuthenticatedActor } from './authenticated-actor';
import type { AuthenticationError } from './authentication-error';

export interface AccessTokenVerifier {
  verify(accessToken: string): Promise<Result<AuthenticatedActor, AuthenticationError>>;
}
