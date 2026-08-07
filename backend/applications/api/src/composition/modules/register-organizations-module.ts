import {
  CreateOrganizationHandler,
  CreateOrganizationMessage,
} from '@/modules/organizations/application';
import { OrganizationId } from '@/modules/organizations/domain';
import { registerCreateOrganizationRoute } from '@/modules/organizations/infrastructure';
import { CreateOrganizationPresenter } from '@/modules/organizations/presentation';
import { UuidV7Generator } from '@/shared/infrastructure/id-generator';
import type { ApplicationModule } from './application-module';

export const organizationsModule: ApplicationModule = {
  register(container, options) {
    const dependencies = container.cradle;
    const handler = new CreateOrganizationHandler({
      clock: dependencies.clock,
      organizationIdGenerator: new UuidV7Generator(OrganizationId.create, options.uuidSource),
      domainEventIdGenerator: dependencies.domainEventIdGenerator,
      messageIdGenerator: dependencies.messageIdGenerator,
      unitOfWork: dependencies.organizationUnitOfWork,
      logger: dependencies.logger,
    });
    dependencies.mediator.register(CreateOrganizationMessage, handler.handle.bind(handler));
  },
  registerRoutes(app, container) {
    const dependencies = container.cradle;
    registerCreateOrganizationRoute(app, {
      mediator: dependencies.mediator,
      messageTranslator: dependencies.translator,
      presenter: new CreateOrganizationPresenter(dependencies.translator),
    });
  },
};
