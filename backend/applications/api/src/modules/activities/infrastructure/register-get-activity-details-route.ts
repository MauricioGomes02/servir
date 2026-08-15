import { GetActivityDetailsErrorCodes, GetActivityDetailsMessage } from '../application';
import type { GetActivityDetailsPresenter } from '../presentation';
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

export function registerGetActivityDetailsRoute(
  app: FastifyInstance,
  dependencies: {
    readonly mediator: Mediator;
    readonly messageTranslator: MessageTranslator;
    readonly presenter: GetActivityDetailsPresenter;
  },
): void {
  app.get('/organizations/:organizationId/activities/:activityId', async (request, reply) => {
    const context = requireHttpExecutionContext(request.executionContext);
    const params = request.params as { organizationId?: unknown; activityId?: unknown };
    const result = await dependencies.mediator.send(
      GetActivityDetailsMessage,
      { organizationId: params.organizationId, activityId: params.activityId },
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
        view.error.code === GetActivityDetailsErrorCodes.ActivityNotFound
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
