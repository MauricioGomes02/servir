import { registerMemberRoute } from '@/modules/membership/infrastructure';
import { registerCreateOrganizationRoute } from '@/modules/organizations/infrastructure';
import type { FastifyInstance } from 'fastify';

import type { ApplicationContainer } from './container';

export function registerApplicationRoutes(
  app: FastifyInstance,
  container: ApplicationContainer,
): void {
  const dependencies = container.cradle;

  registerCreateOrganizationRoute(app, {
    handler: dependencies.createOrganizationHandler,
    messageTranslator: dependencies.translator,
    presenter: dependencies.createOrganizationPresenter,
  });
  registerMemberRoute(app, {
    handler: dependencies.registerMemberHandler,
    messageTranslator: dependencies.translator,
    presenter: dependencies.registerMemberPresenter,
  });
}
