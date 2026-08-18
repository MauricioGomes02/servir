import staticFiles from '@fastify/static';
import type { FastifyInstance } from 'fastify';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { bffMessages } from '../shared/localization.js';

export async function registerWebDelivery(app: FastifyInstance): Promise<void> {
  const webRoot = resolve(import.meta.dirname, '../../../web/dist');
  if (!existsSync(webRoot)) return;
  await app.register(staticFiles, { root: webRoot, wildcard: false });
  app.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith('/bff/') || request.url.startsWith('/health/')) {
      return reply
        .status(404)
        .type('application/problem+json')
        .send({
          type: '/problems/not-found',
          title: bffMessages(request).resourceNotFound,
          status: 404,
        });
    }
    return reply.sendFile('index.html');
  });
}
