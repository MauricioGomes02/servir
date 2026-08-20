import {
  AuthenticationErrorCodes,
  type AccessTokenVerifier,
  type AuthenticationError,
} from '@/shared/application/authentication';
import { createExecutionContext } from '@/shared/application/context';
import { failure, success, type Result } from '@/shared/core/result';
import {
  presentedHttpProblem,
  PresentedHttpProblemKinds,
} from '@/shared/infrastructure/http/problem-details';
import type { MessageTranslator } from '@/shared/presentation';
import type { FastifyInstance } from 'fastify';

import { requireHttpExecutionContext } from './require-http-execution-context';
import { sendExpectedProblem } from './send-presented-problem';

function bearerToken(
  authorization: string | undefined,
): Result<string | undefined, AuthenticationError> {
  if (authorization === undefined) return success(undefined);

  const match = /^Bearer ([^\s]+)$/i.exec(authorization);

  if (match === null) return failure({ code: AuthenticationErrorCodes.MissingAccessToken });

  return success(match[1]);
}

export function registerFastifyAuthentication(
  app: FastifyInstance,
  accessTokenVerifier: AccessTokenVerifier,
  messageTranslator: MessageTranslator,
): void {
  app.addHook('preValidation', async (request, reply) => {
    const routeConfig = request.routeOptions.config as { authentication?: string };
    if (routeConfig.authentication === 'bootstrap') return;
    const token = bearerToken(request.headers.authorization);

    if (!token.success) {
      return sendExpectedProblem(reply, {
        context: requireHttpExecutionContext(request.executionContext),
        error: token.error,
        locale: request.locale,
        problem: presentedHttpProblem(PresentedHttpProblemKinds.AuthenticationRequired),
        translator: messageTranslator,
      });
    }

    if (token.value === undefined) return;

    const result = await accessTokenVerifier.verify(token.value);

    if (!result.success) {
      return sendExpectedProblem(reply, {
        context: requireHttpExecutionContext(request.executionContext),
        error: result.error,
        locale: request.locale,
        problem: presentedHttpProblem(PresentedHttpProblemKinds.AuthenticationRequired),
        translator: messageTranslator,
      });
    }

    if (request.executionContext === null) return;

    const { correlationId, requestId } = request.executionContext;
    request.executionContext = createExecutionContext({
      actor: result.value,
      correlationId,
      ...(requestId === undefined ? {} : { requestId }),
    });
  });
}
