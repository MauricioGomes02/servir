import {
  GetMinistryDetailsErrorCodes,
  GetMinistryDetailsMessage,
} from '@/modules/ministries/application';
import type { GetMinistryDetailsPresenter } from '@/modules/ministries/presentation';
import type { Mediator } from '@/shared/application/mediator';
import {
  requireHttpExecutionContext,
  sendPresentedProblem,
} from '@/shared/infrastructure/http/fastify';
import {
  presentedHttpProblemForCode,
  PresentedHttpProblemKinds,
} from '@/shared/infrastructure/http/problem-details';
import type { MessageTranslator } from '@/shared/presentation';
import type { FastifyInstance } from 'fastify';

export function registerGetMinistryDetailsRoute(
  app: FastifyInstance,
  dependencies: {
    readonly mediator: Mediator;
    readonly messageTranslator: MessageTranslator;
    readonly presenter: GetMinistryDetailsPresenter;
  },
): void {
  app.get('/organizations/:organizationId/ministries/:ministryId', async (request, reply) => {
    const context = requireHttpExecutionContext(request.executionContext);
    const params = request.params as { organizationId?: unknown; ministryId?: unknown };
    const result = await dependencies.mediator.send(
      GetMinistryDetailsMessage,
      { organizationId: params.organizationId, ministryId: params.ministryId },
      context,
    );
    const view = dependencies.presenter.present(result, context, request.locale);
    if (view.kind === 'success') return reply.status(200).send(view.resource);
    return sendPresentedProblem(reply, {
      context,
      error: view.error,
      errors: view.errors,
      locale: request.locale,
      translator: dependencies.messageTranslator,
      problem: presentedHttpProblemForCode(view.error.code, {
        resourceNotFound: [GetMinistryDetailsErrorCodes.MinistryNotFound],
        fallback: PresentedHttpProblemKinds.InvalidRequest,
      }),
    });
  });
}
