import type { FastifyInstance } from 'fastify';

import { FastifyRequestLogger } from './fastify-request-logger';

export function registerFastifyRequestLogging(
  app: FastifyInstance,
  requestLogger: FastifyRequestLogger,
): void {
  app.addHook('onRequest', async (request) => {
    requestLogger.start(request);
  });

  app.addHook('onResponse', async (request, reply) => {
    requestLogger.finish(request, reply);
  });
}
