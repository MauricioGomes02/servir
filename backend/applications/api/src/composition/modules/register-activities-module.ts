import {
  CreateActivityHandler,
  CreateActivityMessage,
  GetActivityDetailsHandler,
  GetActivityDetailsMessage,
  ListActivitiesHandler,
  ListActivitiesMessage,
  ScheduleManualActivityOccurrenceHandler,
  ScheduleManualActivityOccurrenceMessage,
} from '@/modules/activities/application';
import {
  ActivityCreationPolicy,
  ActivityId,
  ActivityOccurrenceId,
  ActivityOccurrenceSchedulingPolicy,
} from '@/modules/activities/domain';
import {
  registerCreateActivityRoute,
  registerGetActivityDetailsRoute,
  registerListActivitiesRoute,
  registerScheduleManualActivityOccurrenceRoute,
  TemporalCivilScheduleResolver,
} from '@/modules/activities/infrastructure';
import {
  CreateActivityPresenter,
  GetActivityDetailsPresenter,
  ListActivitiesPresenter,
  ScheduleManualActivityOccurrencePresenter,
} from '@/modules/activities/presentation';
import { UuidV7Generator } from '@/shared/infrastructure/id-generator';
import type { ApplicationModule } from './application-module';
import {
  activityCreationFacts,
  activityDetailsReader,
  activityListReader,
  activityOccurrenceSchedulingFacts,
  activityOccurrenceUnitOfWork,
  activityUnitOfWork,
} from '../persistence/activities-persistence-module';

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
    dependencies.mediator.registerHandler(
      ListActivitiesMessage,
      new ListActivitiesHandler(options.persistence.services.get(activityListReader)),
    );
    dependencies.mediator.registerHandler(
      GetActivityDetailsMessage,
      new GetActivityDetailsHandler(options.persistence.services.get(activityDetailsReader)),
    );
    dependencies.mediator.registerHandler(
      ScheduleManualActivityOccurrenceMessage,
      new ScheduleManualActivityOccurrenceHandler({
        clock: dependencies.clock,
        occurrenceIdGenerator: new UuidV7Generator(ActivityOccurrenceId.create, options.uuidSource),
        domainEventIdGenerator: dependencies.domainEventIdGenerator,
        messageIdGenerator: dependencies.messageIdGenerator,
        resolver: new TemporalCivilScheduleResolver(),
        facts: options.persistence.services.get(activityOccurrenceSchedulingFacts),
        policy: new ActivityOccurrenceSchedulingPolicy(),
        unitOfWork: options.persistence.services.get(activityOccurrenceUnitOfWork),
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
    registerListActivitiesRoute(app, {
      mediator: dependencies.mediator,
      presenter: new ListActivitiesPresenter(dependencies.translator),
      messageTranslator: dependencies.translator,
    });
    registerGetActivityDetailsRoute(app, {
      mediator: dependencies.mediator,
      presenter: new GetActivityDetailsPresenter(dependencies.translator),
      messageTranslator: dependencies.translator,
    });
    registerScheduleManualActivityOccurrenceRoute(app, {
      mediator: dependencies.mediator,
      presenter: new ScheduleManualActivityOccurrencePresenter(dependencies.translator),
      messageTranslator: dependencies.translator,
    });
  },
};
