import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { GoogleAuthenticationRouteDependencies } from '../authentication/register-google-authentication-routes.js';
import { verifyMutationCsrf, verifyRequestSession } from '../authentication/session-guard.js';

export function registerSessionGuard(
  app: FastifyInstance,
  authentication: GoogleAuthenticationRouteDependencies | undefined,
): (request: FastifyRequest) => string | undefined {
  const accessTokens = new WeakMap<FastifyRequest, string>();
  if (authentication === undefined) return (request) => accessTokens.get(request);

  app.addHook('preHandler', async (request, reply) => {
    if (!request.url.startsWith('/bff/') || request.url.startsWith('/bff/auth/')) return;
    let session;
    try {
      session = await verifyRequestSession(request, authentication.credentialIssuer);
    } catch {
      return reply.status(401).send({ code: 'identity.session.invalid' });
    }
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      try {
        verifyMutationCsrf(request, session, authentication.callbackUrl.origin);
      } catch {
        return reply.status(403).send({ code: 'identity.csrf.invalid' });
      }
    }
    try {
      accessTokens.set(
        request,
        await authentication.credentialIssuer.issueAccessToken(session.userId),
      );
    } catch {
      return reply.status(500).send({ code: 'identity.access_token.issue_failed' });
    }
  });
  return (request) => accessTokens.get(request);
}
