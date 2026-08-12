import { ListMinistriesErrorCodes, ListMinistriesMessage } from '@/modules/ministries/application';
import type { ListMinistriesPresenter } from '@/modules/ministries/presentation';
import type { Mediator } from '@/shared/application/mediator';
import {
  requireHttpExecutionContext,
  sendPresentedProblem,
} from '@/shared/infrastructure/http/fastify';
import {
  HttpProblemMessageCodes,
  HttpProblemTypes,
} from '@/shared/infrastructure/http/problem-details';
import type { MessageTranslator } from '@/shared/presentation';
import type { FastifyInstance } from 'fastify';

export function registerListMinistriesRoute(
  app: FastifyInstance,
  dependencies: {
    readonly mediator: Mediator;
    readonly messageTranslator: MessageTranslator;
    readonly presenter: ListMinistriesPresenter;
  },
): void {
  app.get('/organizations/:organizationId/ministries', async (request, reply) => {
    const context = requireHttpExecutionContext(request.executionContext);
    const params = request.params as { organizationId?: unknown };
    const query = request.query as Record<string, unknown>;
    const result = await dependencies.mediator.send(
      ListMinistriesMessage,
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
      problem:
        view.error.code === ListMinistriesErrorCodes.OrganizationNotFound
          ? {
              status: 404,
              type: HttpProblemTypes.ResourceNotFound,
              titleCode: HttpProblemMessageCodes.ResourceNotFoundTitle,
            }
          : {
              status: 400,
              type: HttpProblemTypes.InvalidRequest,
              titleCode: HttpProblemMessageCodes.InvalidRequestTitle,
            },
    });
  });
}
