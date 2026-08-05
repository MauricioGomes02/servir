export class RegisterMemberRouteContextError extends Error {
  readonly code = 'membership.http.execution_context_unavailable';

  constructor() {
    super('Execution context is unavailable while registering a member');
    this.name = 'RegisterMemberRouteContextError';
  }
}
