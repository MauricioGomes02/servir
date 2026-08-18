export interface UserProvisioningClient {
  provision(bootstrapAssertion: string): Promise<{ readonly userId: string }>;
}

export class ApiUserProvisioningClient implements UserProvisioningClient {
  constructor(
    private readonly apiBaseUrl: URL,
    private readonly timeoutMs: number,
  ) {}

  async provision(bootstrapAssertion: string): Promise<{ readonly userId: string }> {
    let response: Response;
    try {
      response = await fetch(new URL('/identity/users/provision', this.apiBaseUrl), {
        method: 'POST',
        headers: { authorization: `Bearer ${bootstrapAssertion}` },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      throw new BffAuthenticationError(BffAuthenticationErrorCodes.ProvisioningFailed, {
        cause: error,
      });
    }
    if (!response.ok) {
      throw new BffAuthenticationError(BffAuthenticationErrorCodes.ProvisioningFailed, {
        cause: Object.freeze({ status: response.status }),
      });
    }
    const body: unknown = await response.json();
    if (
      typeof body !== 'object' ||
      body === null ||
      !('userId' in body) ||
      typeof body.userId !== 'string'
    ) {
      throw new BffAuthenticationError(BffAuthenticationErrorCodes.ProvisioningResponseInvalid);
    }
    return Object.freeze({ userId: body.userId });
  }
}
import { BffAuthenticationError, BffAuthenticationErrorCodes } from './authentication-error.js';
