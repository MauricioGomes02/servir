import type { ProvisionUserFromExternalIdentityHandler } from '@/modules/identity/application';
import type { BootstrapAssertionVerifier } from '@/shared/application/authentication';
import { createExecutionContext } from '@/shared/application/context';
import {
  HttpAuthenticationError,
  requireHttpExecutionContext,
} from '@/shared/infrastructure/http/fastify';
import type { FastifyInstance } from 'fastify';

export interface ProvisionUserRouteDependencies {
  readonly bootstrapAssertionVerifier: BootstrapAssertionVerifier;
  readonly handler: ProvisionUserFromExternalIdentityHandler;
}

function bearerToken(authorization: string | undefined): string {
  const match = authorization === undefined ? null : /^Bearer ([^\s]+)$/i.exec(authorization);
  if (match === null) throw HttpAuthenticationError.missingAccessToken();
  return match[1];
}

export function registerProvisionUserRoute(
  app: FastifyInstance,
  dependencies: ProvisionUserRouteDependencies,
): void {
  app.post(
    '/identity/users/provision',
    { config: { authentication: 'bootstrap' } },
    async (request, reply) => {
      const token = bearerToken(request.headers.authorization);
      const assertion =
        await dependencies.bootstrapAssertionVerifier.verifyBootstrapAssertion(token);
      if (!assertion.success) throw new HttpAuthenticationError(assertion.error.code);

      const baseContext = requireHttpExecutionContext(request.executionContext);
      const context = createExecutionContext({
        correlationId: baseContext.correlationId,
        externalIdentityAssertion: assertion.value,
        ...(baseContext.requestId === undefined ? {} : { requestId: baseContext.requestId }),
      });
      const result = await dependencies.handler.handle(context);
      if (!result.success) {
        return reply.status(422).send({ code: result.error.code });
      }
      return reply.status(result.value.created ? 201 : 200).send({
        created: result.value.created,
        userId: result.value.userId.toString(),
      });
    },
  );
}
