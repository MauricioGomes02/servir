import type { Result } from '@/shared/core/result';

import type { AuthenticationError } from './authentication-error';
import type { ExternalIdentityAssertion } from './external-identity-assertion';

export interface BootstrapAssertionVerifier {
  verifyBootstrapAssertion(
    token: string,
  ): Promise<Result<ExternalIdentityAssertion, AuthenticationError>>;
}
