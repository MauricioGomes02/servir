export class FastifyRequestContextError extends Error {
  readonly code = 'http.fastify.request_context.invalid_request_id';

  constructor(cause: unknown) {
    super('Fastify produced an invalid request ID', { cause });
    this.name = 'FastifyRequestContextError';
  }
}
