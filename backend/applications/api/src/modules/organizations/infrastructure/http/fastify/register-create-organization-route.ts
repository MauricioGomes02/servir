import type { CreateOrganizationHandler } from '@/modules/organizations/application';
import type { CreateOrganizationPresenter } from '@/modules/organizations/presentation';
import {
  createValidationProblemDetails,
  HttpProblemMessageCodes,
} from '@/shared/infrastructure/http/problem-details';
import type { MessageTranslator } from '@/shared/presentation';
import type { FastifyInstance } from 'fastify';

import { CreateOrganizationRouteContextError } from './create-organization-route-context-error';

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
    const context = request.executionContext;

    if (context === null) {
      throw new CreateOrganizationRouteContextError();
    }

    const result = await dependencies.handler.handle(
      { name: organizationName(request.body) },
      context,
    );
    const view = dependencies.presenter.present(
      result,
      context,
      request.locale,
    );

    if (view.kind === 'failure') {
      return reply
        .status(422)
        .type('application/problem+json')
        .header('content-language', request.locale)
        .send(createValidationProblemDetails({
          title: dependencies.messageTranslator.translate({
            code: HttpProblemMessageCodes.ValidationErrorTitle,
            locale: request.locale,
          }),
          status: 422,
          correlationId: context.correlationId,
          requestId: context.requestId,
          errors: [view.error],
        }));
    }

    return reply
      .status(201)
      .header('location', `/organizations/${encodeURIComponent(view.resource.id)}`)
      .send(view.resource);
  });
}
