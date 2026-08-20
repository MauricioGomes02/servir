import type { ProvisionUserFromExternalIdentityHandler } from '@/modules/identity/application';
import {
  AuthenticationErrorCodes,
  type AuthenticationError,
  type BootstrapAssertionVerifier,
} from '@/shared/application/authentication';
import { createExecutionContext } from '@/shared/application/context';
import { failure, success, type Result } from '@/shared/core/result';
import {
  requireHttpExecutionContext,
  sendExpectedProblem,
} from '@/shared/infrastructure/http/fastify';
import {
  presentedHttpProblem,
  PresentedHttpProblemKinds,
} from '@/shared/infrastructure/http/problem-details';
import type { MessageTranslator } from '@/shared/presentation';
import type { FastifyInstance } from 'fastify';

export interface ProvisionUserRouteDependencies {
  readonly bootstrapAssertionVerifier: BootstrapAssertionVerifier;
  readonly handler: Pick<ProvisionUserFromExternalIdentityHandler, 'handle'>;
  readonly messageTranslator: MessageTranslator;
}

function bearerToken(authorization: string | undefined): Result<string, AuthenticationError> {
  const match = authorization === undefined ? null : /^Bearer ([^\s]+)$/i.exec(authorization);
  if (match === null) return failure({ code: AuthenticationErrorCodes.MissingAccessToken });
  return success(match[1]);
}

export function registerProvisionUserRoute(
  app: FastifyInstance,
  dependencies: ProvisionUserRouteDependencies,
): void {
  app.post(
    '/identity/users/provision',
    { config: { authentication: 'bootstrap' } },
    async (request, reply) => {
      const baseContext = requireHttpExecutionContext(request.executionContext);
      const token = bearerToken(request.headers.authorization);
      if (!token.success) {
        return sendExpectedProblem(reply, {
          context: baseContext,
          error: token.error,
          locale: request.locale,
          problem: presentedHttpProblem(PresentedHttpProblemKinds.AuthenticationRequired),
          translator: dependencies.messageTranslator,
        });
      }
      const assertion = await dependencies.bootstrapAssertionVerifier.verifyBootstrapAssertion(
        token.value,
      );
      if (!assertion.success) {
        return sendExpectedProblem(reply, {
          context: baseContext,
          error: assertion.error,
          locale: request.locale,
          problem: presentedHttpProblem(PresentedHttpProblemKinds.AuthenticationRequired),
          translator: dependencies.messageTranslator,
        });
      }

      const context = createExecutionContext({
        correlationId: baseContext.correlationId,
        externalIdentityAssertion: assertion.value,
        ...(baseContext.requestId === undefined ? {} : { requestId: baseContext.requestId }),
      });
      const result = await dependencies.handler.handle(context);
      if (!result.success) {
        return sendExpectedProblem(reply, {
          context,
          error: result.error,
          locale: request.locale,
          problem: presentedHttpProblem(PresentedHttpProblemKinds.ValidationError),
          translator: dependencies.messageTranslator,
        });
      }
      return reply.status(result.value.created ? 201 : 200).send({
        created: result.value.created,
        userId: result.value.userId.toString(),
      });
    },
  );
}
