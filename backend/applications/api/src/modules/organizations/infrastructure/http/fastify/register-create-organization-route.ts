import { CreateOrganizationMessage } from '@/modules/organizations/application';
import type { Mediator } from '@/shared/application/mediator';
import type { CreateOrganizationPresenter } from '@/modules/organizations/presentation';
import { presentedHttpProblemForCode } from '@/shared/infrastructure/http/problem-details';
import {
  requireHttpExecutionContext,
  sendPresentedProblem,
} from '@/shared/infrastructure/http/fastify';
import type { MessageTranslator } from '@/shared/presentation';
import type { FastifyInstance } from 'fastify';

export interface CreateOrganizationRouteDependencies {
  readonly mediator: Mediator;
  readonly messageTranslator: MessageTranslator;
  readonly presenter: CreateOrganizationPresenter;
}

function organizationName(body: unknown): unknown {
  if (typeof body !== 'object' || body === null || !('name' in body)) {
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

    const result = await dependencies.mediator.send(
      CreateOrganizationMessage,
      { name: organizationName(request.body) },
      context,
    );
    const view = dependencies.presenter.present(result, context, request.locale);

    if (view.kind === 'failure') {
      return sendPresentedProblem(reply, {
        context,
        error: view.error,
        locale: request.locale,
        problem: presentedHttpProblemForCode(view.error.code, {
          authenticationRequired: ['organization.creation.authenticated_actor_required'],
        }),
        translator: dependencies.messageTranslator,
      });
    }

    return reply
      .status(201)
      .header('location', `/organizations/${encodeURIComponent(view.resource.id)}`)
      .send(view.resource);
  });
}
