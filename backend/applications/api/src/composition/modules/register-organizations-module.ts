import {
  CreateOrganizationHandler,
  CreateOrganizationMessage,
  GetOrganizationDetailsHandler,
  GetOrganizationDetailsMessage,
} from '@/modules/organizations/application';
import { OrganizationId } from '@/modules/organizations/domain';
import { OrganizationAccessId } from '@/modules/identity/domain';
import {
  registerCreateOrganizationRoute,
  registerGetOrganizationDetailsRoute,
} from '@/modules/organizations/infrastructure';
import {
  CreateOrganizationPresenter,
  GetOrganizationDetailsPresenter,
} from '@/modules/organizations/presentation';
import { UuidV7Generator } from '@/shared/infrastructure/id-generator';
import type { ApplicationModule } from './application-module';
import {
  organizationDetailsReader,
  organizationUnitOfWork,
} from './organizations-persistence-module';

export const organizationsModule: ApplicationModule = {
  register(container, options) {
    const dependencies = container.cradle;
    const handler = new CreateOrganizationHandler({
      clock: dependencies.clock,
      organizationIdGenerator: new UuidV7Generator(OrganizationId.create, options.uuidSource),
      organizationAccessIdGenerator: new UuidV7Generator(
        OrganizationAccessId.create,
        options.uuidSource,
      ),
      domainEventIdGenerator: dependencies.domainEventIdGenerator,
      messageIdGenerator: dependencies.messageIdGenerator,
      unitOfWork: options.persistence.services.get(organizationUnitOfWork),
      logger: dependencies.logger,
    });
    dependencies.mediator.registerHandler(CreateOrganizationMessage, handler);
    dependencies.mediator.registerHandler(
      GetOrganizationDetailsMessage,
      new GetOrganizationDetailsHandler(
        options.persistence.services.get(organizationDetailsReader),
      ),
    );
  },
  registerRoutes(app, container) {
    const dependencies = container.cradle;
    registerCreateOrganizationRoute(app, {
      mediator: dependencies.mediator,
      messageTranslator: dependencies.translator,
      presenter: new CreateOrganizationPresenter(dependencies.translator),
    });
    registerGetOrganizationDetailsRoute(app, {
      mediator: dependencies.mediator,
      messageTranslator: dependencies.translator,
      presenter: new GetOrganizationDetailsPresenter(dependencies.translator),
    });
  },
};
