import type { CreateOrganizationHandler } from '@/modules/organizations/application';
import type { CreateOrganizationPresenter } from '@/modules/organizations/presentation';
import {
  HttpProblemMessageCodes,
  HttpProblemTypes,
} from '@/shared/infrastructure/http/problem-details';
import {
  requireHttpExecutionContext,
  sendPresentedProblem,
} from '@/shared/infrastructure/http/fastify';
import type { MessageTranslator } from '@/shared/presentation';
import { traceUseCase } from '@/shared/infrastructure/telemetry';
import type { FastifyInstance } from 'fastify';

export interface CreateOrganizationRouteDependencies {
  readonly handler: CreateOrganizationHandler;
  readonly messageTranslator: MessageTranslator;
  readonly presenter: CreateOrganizationPresenter;
}

function organizationName(body: unknown): unknown {
  if (
    typeof body !== 'object'
    || body === null
    || !('name' in body)
  ) {
    return undefined;
  }

  return body.name;
}

export function registerCreateOrganizationRoute(
  app: FastifyInstance,
  dependencies: CreateOrganizationRouteDependencies,
): void {
  app.post('/organizations', async (request, reply) => {
    const context = requireHttpExecutionContext(request.executionContext);

    const result = await traceUseCase(
      'CreateOrganization',
      () => dependencies.handler.handle(
        { name: organizationName(request.body) },
        context,
      ),
    );
    const view = dependencies.presenter.present(
      result,
      context,
      request.locale,
    );

    if (view.kind === 'failure') {
      return sendPresentedProblem(reply, {
        context,
        error: view.error,
        locale: request.locale,
        problem: {
          status: 422,
          type: HttpProblemTypes.ValidationError,
          titleCode: HttpProblemMessageCodes.ValidationErrorTitle,
        },
        translator: dependencies.messageTranslator,
      });
    }

    return reply
      .status(201)
      .header('location', `/organizations/${encodeURIComponent(view.resource.id)}`)
      .send(view.resource);
  });
}
