export interface UserProvisioningClient {
  provision(bootstrapAssertion: string): Promise<{ readonly userId: string }>;
}

export class ApiUserProvisioningClient implements UserProvisioningClient {
  constructor(
    private readonly apiBaseUrl: URL,
    private readonly timeoutMs: number,
  ) {}

  async provision(bootstrapAssertion: string): Promise<{ readonly userId: string }> {
    const response = await fetch(new URL('/identity/users/provision', this.apiBaseUrl), {
      method: 'POST',
      headers: { authorization: `Bearer ${bootstrapAssertion}` },
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!response.ok) throw new Error(`user provisioning failed with status ${response.status}`);
    const body: unknown = await response.json();
    if (
      typeof body !== 'object' ||
      body === null ||
      !('userId' in body) ||
      typeof body.userId !== 'string'
    ) {
      throw new Error('user provisioning returned an invalid response');
    }
    return Object.freeze({ userId: body.userId });
  }
}
