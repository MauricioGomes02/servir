import staticFiles from '@fastify/static';
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { BffConfig } from './config.js';

interface OrganizationParameters {
  readonly organizationId: string;
}

async function sendToApi(
  request: FastifyRequest,
  reply: FastifyReply,
  config: BffConfig,
  path: string,
): Promise<FastifyReply> {
  try {
    const response = await fetch(new URL(path, config.apiBaseUrl), {
      method: request.method,
      headers: {
        accept: 'application/json',
        'accept-language': request.headers['accept-language'] ?? 'pt-BR',
        ...(request.headers['content-type']
          ? { 'content-type': request.headers['content-type'] }
          : {}),
      },
      body:
        request.method === 'GET' || request.method === 'HEAD'
          ? undefined
          : JSON.stringify(request.body),
      signal: AbortSignal.timeout(config.apiTimeoutMs),
    });
    reply.status(response.status);
    const contentType = response.headers.get('content-type');
    if (contentType) reply.header('content-type', contentType);
    const correlationId = response.headers.get('x-correlation-id');
    if (correlationId) reply.header('x-correlation-id', correlationId);
    return reply.send(await response.text());
  } catch (error) {
    request.log.error({ err: error }, 'api upstream request failed');
    return reply.status(502).type('application/problem+json').send({
      type: '/problems/upstream-unavailable',
      title: 'O serviço está temporariamente indisponível.',
      status: 502,
    });
  }
}

export async function createApplication(
  config: BffConfig,
  options: { readonly logger?: boolean } = {},
): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? true, bodyLimit: 32 * 1024 });

  app.post('/bff/organizations', (request, reply) =>
    sendToApi(request, reply, config, '/organizations'),
  );
  app.get<{ Params: OrganizationParameters }>(
    '/bff/organizations/:organizationId',
    (request, reply) =>
      sendToApi(
        request,
        reply,
        config,
        `/organizations/${encodeURIComponent(request.params.organizationId)}`,
      ),
  );

  const webRoot = resolve(import.meta.dirname, '../../web/dist');
  if (existsSync(webRoot)) {
    await app.register(staticFiles, { root: webRoot, wildcard: false });
    app.setNotFoundHandler((_request, reply) => reply.sendFile('index.html'));
  }
  return app;
}
