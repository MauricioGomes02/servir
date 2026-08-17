import type { AccessTokenVerifier } from '@/shared/application/authentication';
import { createExecutionContext } from '@/shared/application/context';
import type { FastifyInstance } from 'fastify';

import { HttpAuthenticationError } from './http-authentication-error';

function bearerToken(authorization: string | undefined): string | undefined {
  if (authorization === undefined) return undefined;

  const match = /^Bearer ([^\s]+)$/i.exec(authorization);

  if (match === null) throw HttpAuthenticationError.missingAccessToken();

  return match[1];
}

export function registerFastifyAuthentication(
  app: FastifyInstance,
  accessTokenVerifier: AccessTokenVerifier,
): void {
  app.addHook('preValidation', async (request) => {
    const routeConfig = request.routeOptions.config as { authentication?: string };
    if (routeConfig.authentication === 'bootstrap') return;
    const accessToken = bearerToken(request.headers.authorization);

    if (accessToken === undefined) return;

    const result = await accessTokenVerifier.verify(accessToken);

    if (!result.success) throw new HttpAuthenticationError(result.error.code);

    if (request.executionContext === null) return;

    const { correlationId, requestId } = request.executionContext;
    request.executionContext = createExecutionContext({
      actor: result.value,
      correlationId,
      ...(requestId === undefined ? {} : { requestId }),
    });
  });
}
