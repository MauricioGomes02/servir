import { ListAccessibleOrganizationsMessage } from '@/modules/organizations/application';
import type { ListAccessibleOrganizationsPresenter } from '@/modules/organizations/presentation';
import type { Mediator } from '@/shared/application/mediator';
import {
  requireAuthenticatedActor,
  requireHttpExecutionContext,
  sendPresentedProblem,
} from '@/shared/infrastructure/http/fastify';
import {
  HttpProblemMessageCodes,
  HttpProblemTypes,
} from '@/shared/infrastructure/http/problem-details';
import type { MessageTranslator } from '@/shared/presentation';
import type { FastifyInstance } from 'fastify';

export function registerListAccessibleOrganizationsRoute(
  app: FastifyInstance,
  dependencies: {
    readonly mediator: Mediator;
    readonly messageTranslator: MessageTranslator;
    readonly presenter: ListAccessibleOrganizationsPresenter;
  },
): void {
  app.get('/organizations', async (request, reply) => {
    const context = requireHttpExecutionContext(request.executionContext);
    requireAuthenticatedActor(context);
    const result = await dependencies.mediator.send(
      ListAccessibleOrganizationsMessage,
      {},
      context,
    );
    const view = dependencies.presenter.present(result, context, request.locale);
    if (view.kind === 'success') return reply.status(200).send(view.resource);
    return sendPresentedProblem(reply, {
      context,
      error: view.error,
      locale: request.locale,
      translator: dependencies.messageTranslator,
      problem: {
        status: 401,
        type: HttpProblemTypes.AuthenticationRequired,
        titleCode: HttpProblemMessageCodes.AuthenticationRequiredTitle,
      },
    });
  });
}
