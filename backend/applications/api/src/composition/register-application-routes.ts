import {
  registerGetMemberDetailsRoute,
  registerMemberRoute,
} from '@/modules/membership/infrastructure';
import { registerCreateOrganizationRoute } from '@/modules/organizations/infrastructure';
import {
  registerCreateMinistryRoute,
  registerDefineMinistryRoleRoute,
} from '@/modules/ministries/infrastructure';
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
  registerGetMemberDetailsRoute(app, {
    handler: dependencies.getMemberDetailsHandler,
    messageTranslator: dependencies.translator,
    presenter: dependencies.getMemberDetailsPresenter,
  });
  registerCreateMinistryRoute(app, {
    handler: dependencies.createMinistryHandler,
    messageTranslator: dependencies.translator,
    presenter: dependencies.createMinistryPresenter,
  });
  registerDefineMinistryRoleRoute(app, {
    handler: dependencies.defineMinistryRoleHandler,
    messageTranslator: dependencies.translator,
    presenter: dependencies.defineMinistryRolePresenter,
  });
}
