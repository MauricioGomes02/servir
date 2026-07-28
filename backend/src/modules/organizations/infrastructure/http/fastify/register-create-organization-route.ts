import type { CreateOrganizationHandler } from '@/modules/organizations/application';
import type { CreateOrganizationPresenter } from '@/modules/organizations/presentation';
import type { FastifyInstance } from 'fastify';

import { CreateOrganizationRouteContextError } from './create-organization-route-context-error';

export interface CreateOrganizationRouteDependencies {
  readonly handler: CreateOrganizationHandler;
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

    return reply.status(view.success ? 201 : 422).send(view);
  });
}
