import staticFiles from '@fastify/static';
import type { FastifyInstance } from 'fastify';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { BffProblemCodes } from '../shared/bff-problem-code.js';
import { BffMessageKeys } from '../shared/localization.js';
import { sendBffProblem } from '../shared/problem-details.js';

export async function registerWebDelivery(app: FastifyInstance): Promise<void> {
  const webRoot = resolve(import.meta.dirname, '../../../web/dist');
  if (!existsSync(webRoot)) return;
  await app.register(staticFiles, { root: webRoot, wildcard: false });
  app.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith('/bff/') || request.url.startsWith('/health/')) {
      return sendBffProblem(request, reply, {
        code: BffProblemCodes.ResourceNotFound,
        messageKey: BffMessageKeys.ResourceNotFound,
        status: 404,
        type: '/problems/not-found',
      });
    }
    return reply.sendFile('index.html');
  });
}
