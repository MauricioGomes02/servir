import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { GoogleAuthenticationRouteDependencies } from '../authentication/register-google-authentication-routes.js';
import { BffAuthenticationErrorCodes } from '../authentication/authentication-error.js';
import { verifyMutationCsrf, verifyRequestSession } from '../authentication/session-guard.js';
import { BffMessageKeys } from '../shared/localization.js';
import { sendBffProblem } from '../shared/problem-details.js';

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
      return sendBffProblem(request, reply, {
        code: BffAuthenticationErrorCodes.SessionInvalid,
        messageKey: BffMessageKeys.SessionInvalid,
        status: 401,
        type: '/problems/authentication-required',
      });
    }
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      try {
        verifyMutationCsrf(request, session, authentication.callbackUrl.origin);
      } catch {
        return sendBffProblem(request, reply, {
          code: BffAuthenticationErrorCodes.CsrfInvalid,
          messageKey: BffMessageKeys.CsrfInvalid,
          status: 403,
          type: '/problems/request-forbidden',
        });
      }
    }
    try {
      accessTokens.set(
        request,
        await authentication.credentialIssuer.issueAccessToken(session.userId),
      );
    } catch (error) {
      request.log.error({ err: error }, 'internal access token issue failed');
      return sendBffProblem(request, reply, {
        code: BffAuthenticationErrorCodes.AccessTokenIssueFailed,
        messageKey: BffMessageKeys.AccessTokenIssueFailed,
        status: 500,
        type: '/problems/internal-error',
      });
    }
  });
  return (request) => accessTokens.get(request);
}
