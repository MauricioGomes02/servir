import {
  OpenAvailabilityRequestHandler,
  OpenAvailabilityRequestMessage,
} from '@/modules/availability/application';
import {
  AvailabilityRequestId,
  AvailabilityRequestOpeningPolicy,
} from '@/modules/availability/domain';
import { registerOpenAvailabilityRequestRoute } from '@/modules/availability/infrastructure';
import { OpenAvailabilityRequestPresenter } from '@/modules/availability/presentation';
import { UuidV7Generator } from '@/shared/infrastructure/id-generator';
import type { ApplicationModule } from './application-module';
import {
  availabilityRequestOpeningFacts,
  availabilityRequestUnitOfWork,
} from '../persistence/availability-persistence-module';

export const availabilityModule: ApplicationModule = {
  register(container, options) {
    const dependencies = container.cradle;
    dependencies.mediator.registerHandler(
      OpenAvailabilityRequestMessage,
      new OpenAvailabilityRequestHandler({
        clock: dependencies.clock,
        availabilityRequestIdGenerator: new UuidV7Generator(
          AvailabilityRequestId.create,
          options.uuidSource,
        ),
        domainEventIdGenerator: dependencies.domainEventIdGenerator,
        messageIdGenerator: dependencies.messageIdGenerator,
        facts: options.persistence.services.get(availabilityRequestOpeningFacts),
        policy: new AvailabilityRequestOpeningPolicy(),
        unitOfWork: options.persistence.services.get(availabilityRequestUnitOfWork),
      }),
    );
  },
  registerRoutes(app, container) {
    const dependencies = container.cradle;
    registerOpenAvailabilityRequestRoute(app, {
      mediator: dependencies.mediator,
      presenter: new OpenAvailabilityRequestPresenter(dependencies.translator),
      messageTranslator: dependencies.translator,
    });
  },
};
