export const HttpExecutionContextUnavailableErrorCode =
  'http.execution_context_unavailable';

export class HttpExecutionContextUnavailableError extends Error {
  readonly code = HttpExecutionContextUnavailableErrorCode;

  constructor() {
    super('Execution context is unavailable at the HTTP boundary');
    this.name = 'HttpExecutionContextUnavailableError';
  }
}
