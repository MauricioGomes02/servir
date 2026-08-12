import { GetOrganizationDetailsMessage } from '@/modules/organizations/application';
import { OrganizationIdErrorCodes } from '@/modules/organizations/domain';
import type { GetOrganizationDetailsPresenter } from '@/modules/organizations/presentation';
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

export function registerGetOrganizationDetailsRoute(
  app: FastifyInstance,
  dependencies: {
    readonly mediator: Mediator;
    readonly messageTranslator: MessageTranslator;
    readonly presenter: GetOrganizationDetailsPresenter;
  },
): void {
  app.get('/organizations/:organizationId', async (request, reply) => {
    const context = requireHttpExecutionContext(request.executionContext);
    const params = request.params as { organizationId?: unknown };
    const result = await dependencies.mediator.send(
      GetOrganizationDetailsMessage,
      { organizationId: params.organizationId },
      context,
    );
    const view = dependencies.presenter.present(result, context, request.locale);
    if (view.kind === 'success') return reply.status(200).send(view.resource);
    const invalid = Object.values(OrganizationIdErrorCodes).includes(view.error.code as never);
    return sendPresentedProblem(reply, {
      context,
      error: view.error,
      locale: request.locale,
      translator: dependencies.messageTranslator,
      problem: invalid
        ? {
            status: 400,
            type: HttpProblemTypes.InvalidRequest,
            titleCode: HttpProblemMessageCodes.InvalidRequestTitle,
          }
        : {
            status: 404,
            type: HttpProblemTypes.ResourceNotFound,
            titleCode: HttpProblemMessageCodes.ResourceNotFoundTitle,
          },
    });
  });
}
