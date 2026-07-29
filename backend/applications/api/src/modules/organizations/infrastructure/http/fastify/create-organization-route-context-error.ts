export const CreateOrganizationRouteContextErrorCode =
  'http.organization.create.execution_context_unavailable' as const;

export class CreateOrganizationRouteContextError extends Error {
  readonly code = CreateOrganizationRouteContextErrorCode;

  constructor() {
    super('Execution context is unavailable for the create organization route');
    this.name = 'CreateOrganizationRouteContextError';
  }
}
