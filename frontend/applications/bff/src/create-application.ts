import staticFiles from '@fastify/static';
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { BffConfig } from './config.js';
import {
  registerGoogleAuthenticationRoutes,
  type GoogleAuthenticationRouteDependencies,
} from './authentication/register-google-authentication-routes.js';
import { verifyMutationCsrf, verifyRequestSession } from './authentication/session-guard.js';

interface OrganizationParameters {
  readonly organizationId: string;
}

interface MinistryParameters extends OrganizationParameters {
  readonly ministryId: string;
}

type MinistryRoleParameters = MinistryParameters;

interface MemberParameters extends OrganizationParameters {
  readonly memberId: string;
}

interface ActivityParameters extends OrganizationParameters {
  readonly activityId: string;
}

interface MinistryListQuery {
  readonly page?: string;
  readonly pageSize?: string;
  readonly search?: string;
  readonly status?: string;
}

type MemberListQuery = MinistryListQuery;
type ActivityListQuery = MinistryListQuery;

async function sendToApi(
  request: FastifyRequest,
  reply: FastifyReply,
  config: BffConfig,
  path: string,
  accessToken?: string,
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
        ...(accessToken === undefined ? {} : { authorization: `Bearer ${accessToken}` }),
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
  options: {
    readonly googleAuthentication?: GoogleAuthenticationRouteDependencies;
    readonly logger?: boolean;
  } = {},
): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? true, bodyLimit: 32 * 1024 });

  app.addHook('onSend', async (request, reply, payload) => {
    reply.header('x-content-type-options', 'nosniff');
    reply.header('referrer-policy', 'strict-origin-when-cross-origin');
    reply.header('x-frame-options', 'DENY');
    reply.header(
      'content-security-policy',
      "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; object-src 'none'",
    );
    if (request.url.startsWith('/assets/')) {
      reply.header('cache-control', 'public, max-age=31536000, immutable');
    } else if (!request.url.startsWith('/bff/')) {
      reply.header('cache-control', 'no-cache');
    }
    return payload;
  });

  app.get('/health/live', () => ({ status: 'ok' }));

  if (options.googleAuthentication !== undefined) {
    await registerGoogleAuthenticationRoutes(app, options.googleAuthentication);
  }

  const accessTokens = new WeakMap<FastifyRequest, string>();
  if (options.googleAuthentication !== undefined) {
    app.addHook('preHandler', async (request, reply) => {
      if (!request.url.startsWith('/bff/') || request.url.startsWith('/bff/auth/')) return;
      let session;
      try {
        session = await verifyRequestSession(
          request,
          options.googleAuthentication!.credentialIssuer,
        );
      } catch {
        return reply.status(401).send({ code: 'identity.session.invalid' });
      }
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
        try {
          verifyMutationCsrf(request, session, options.googleAuthentication!.callbackUrl.origin);
        } catch {
          return reply.status(403).send({ code: 'identity.csrf.invalid' });
        }
      }
      try {
        accessTokens.set(
          request,
          await options.googleAuthentication!.credentialIssuer.issueAccessToken(session.userId),
        );
      } catch {
        return reply.status(500).send({ code: 'identity.access_token.issue_failed' });
      }
    });
  }

  const forwardToApi = (
    request: FastifyRequest,
    reply: FastifyReply,
    path: string,
  ): Promise<FastifyReply> => sendToApi(request, reply, config, path, accessTokens.get(request));

  app.post('/bff/organizations', (request, reply) =>
    forwardToApi(request, reply, '/organizations'),
  );
  app.get<{ Params: OrganizationParameters }>(
    '/bff/organizations/:organizationId',
    (request, reply) =>
      forwardToApi(
        request,
        reply,
        `/organizations/${encodeURIComponent(request.params.organizationId)}`,
      ),
  );
  app.get<{ Params: OrganizationParameters; Querystring: MinistryListQuery }>(
    '/bff/organizations/:organizationId/ministries',
    (request, reply) => {
      const query = new URLSearchParams();
      for (const name of ['page', 'pageSize', 'search', 'status'] as const) {
        const value = request.query[name];
        if (value !== undefined) query.set(name, value);
      }
      const suffix = query.size > 0 ? `?${query.toString()}` : '';
      return forwardToApi(
        request,
        reply,
        `/organizations/${encodeURIComponent(request.params.organizationId)}/ministries${suffix}`,
      );
    },
  );
  app.post<{ Params: OrganizationParameters }>(
    '/bff/organizations/:organizationId/ministries',
    (request, reply) =>
      forwardToApi(
        request,
        reply,
        `/organizations/${encodeURIComponent(request.params.organizationId)}/ministries`,
      ),
  );
  app.get<{ Params: MinistryParameters }>(
    '/bff/organizations/:organizationId/ministries/:ministryId',
    (request, reply) =>
      forwardToApi(
        request,
        reply,
        `/organizations/${encodeURIComponent(request.params.organizationId)}/ministries/${encodeURIComponent(request.params.ministryId)}`,
      ),
  );
  app.post<{ Params: MinistryRoleParameters }>(
    '/bff/organizations/:organizationId/ministries/:ministryId/roles',
    (request, reply) =>
      forwardToApi(
        request,
        reply,
        `/organizations/${encodeURIComponent(request.params.organizationId)}/ministries/${encodeURIComponent(request.params.ministryId)}/roles`,
      ),
  );
  app.get<{ Params: OrganizationParameters; Querystring: MemberListQuery }>(
    '/bff/organizations/:organizationId/members',
    (request, reply) => {
      const query = new URLSearchParams();
      for (const name of ['page', 'pageSize', 'search', 'status'] as const) {
        const value = request.query[name];
        if (value !== undefined) query.set(name, value);
      }
      const suffix = query.size > 0 ? `?${query.toString()}` : '';
      return forwardToApi(
        request,
        reply,
        `/organizations/${encodeURIComponent(request.params.organizationId)}/members${suffix}`,
      );
    },
  );
  app.post<{ Params: OrganizationParameters }>(
    '/bff/organizations/:organizationId/members',
    (request, reply) =>
      forwardToApi(
        request,
        reply,
        `/organizations/${encodeURIComponent(request.params.organizationId)}/members`,
      ),
  );
  app.get<{ Params: MemberParameters }>(
    '/bff/organizations/:organizationId/members/:memberId',
    (request, reply) =>
      forwardToApi(
        request,
        reply,
        `/organizations/${encodeURIComponent(request.params.organizationId)}/members/${encodeURIComponent(request.params.memberId)}`,
      ),
  );
  app.get<{ Params: OrganizationParameters; Querystring: ActivityListQuery }>(
    '/bff/organizations/:organizationId/activities',
    (request, reply) => {
      const query = new URLSearchParams();
      for (const name of ['page', 'pageSize', 'search', 'status'] as const) {
        const value = request.query[name];
        if (value !== undefined) query.set(name, value);
      }
      const suffix = query.size > 0 ? `?${query.toString()}` : '';
      return forwardToApi(
        request,
        reply,
        `/organizations/${encodeURIComponent(request.params.organizationId)}/activities${suffix}`,
      );
    },
  );
  app.post<{ Params: OrganizationParameters }>(
    '/bff/organizations/:organizationId/activities',
    (request, reply) =>
      forwardToApi(
        request,
        reply,
        `/organizations/${encodeURIComponent(request.params.organizationId)}/activities`,
      ),
  );
  app.get<{ Params: ActivityParameters }>(
    '/bff/organizations/:organizationId/activities/:activityId',
    (request, reply) =>
      forwardToApi(
        request,
        reply,
        `/organizations/${encodeURIComponent(request.params.organizationId)}/activities/${encodeURIComponent(request.params.activityId)}`,
      ),
  );

  const webRoot = resolve(import.meta.dirname, '../../web/dist');
  if (existsSync(webRoot)) {
    await app.register(staticFiles, { root: webRoot, wildcard: false });
    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/bff/') || request.url.startsWith('/health/')) {
        return reply.status(404).type('application/problem+json').send({
          type: '/problems/not-found',
          title: 'Recurso não encontrado.',
          status: 404,
        });
      }
      return reply.sendFile('index.html');
    });
  }
  return app;
}
