export class HttpOrganizationAuthorizationError extends Error {
  readonly statusCode = 403;

  constructor() {
    super('identity.organization_access.forbidden');
    this.name = 'HttpOrganizationAuthorizationError';
  }
}
