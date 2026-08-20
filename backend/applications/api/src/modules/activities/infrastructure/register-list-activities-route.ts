import { ListActivitiesErrorCodes, ListActivitiesMessage } from '../application';
import type { ListActivitiesPresenter } from '../presentation';
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

export function registerListActivitiesRoute(
  app: FastifyInstance,
  dependencies: {
    readonly mediator: Mediator;
    readonly messageTranslator: MessageTranslator;
    readonly presenter: ListActivitiesPresenter;
  },
): void {
  app.get('/organizations/:organizationId/activities', async (request, reply) => {
    const context = requireHttpExecutionContext(request.executionContext);
    const params = request.params as { organizationId?: unknown };
    const query = request.query as Record<string, unknown>;
    const result = await dependencies.mediator.send(
      ListActivitiesMessage,
      {
        organizationId: params.organizationId,
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        status: query.status,
      },
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
        resourceNotFound: [ListActivitiesErrorCodes.OrganizationNotFound],
        fallback: PresentedHttpProblemKinds.InvalidRequest,
      }),
    });
  });
}
