import { CreateActivityHandler, CreateActivityMessage } from '@/modules/activities/application';
import { ActivityCreationPolicy, ActivityId } from '@/modules/activities/domain';
import { registerCreateActivityRoute } from '@/modules/activities/infrastructure';
import { CreateActivityPresenter } from '@/modules/activities/presentation';
import { UuidV7Generator } from '@/shared/infrastructure/id-generator';
import type { ApplicationModule } from './application-module';
import { activityCreationFacts, activityUnitOfWork } from './activities-persistence-module';

export const activitiesModule: ApplicationModule = {
  register(container, options) {
    const dependencies = container.cradle;
    dependencies.mediator.registerHandler(
      CreateActivityMessage,
      new CreateActivityHandler({
        clock: dependencies.clock,
        activityIdGenerator: new UuidV7Generator(ActivityId.create, options.uuidSource),
        domainEventIdGenerator: dependencies.domainEventIdGenerator,
        messageIdGenerator: dependencies.messageIdGenerator,
        facts: options.persistence.services.get(activityCreationFacts),
        policy: new ActivityCreationPolicy(),
        unitOfWork: options.persistence.services.get(activityUnitOfWork),
      }),
    );
  },
  registerRoutes(app, container) {
    const dependencies = container.cradle;
    registerCreateActivityRoute(app, {
      mediator: dependencies.mediator,
      presenter: new CreateActivityPresenter(dependencies.translator),
      messageTranslator: dependencies.translator,
    });
  },
};
