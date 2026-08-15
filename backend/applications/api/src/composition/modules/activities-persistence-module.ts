import type {
  ActivityCreationFactsReader,
  ActivityDetailsReader,
  ActivityListReader,
  ActivityOccurrenceSchedulingFactsReader,
  ActivityOccurrenceWriteScope,
  ActivityWriteScope,
} from '@/modules/activities/application';
import type { ActivityCreated, ActivityOccurrenceScheduled } from '@/modules/activities/domain';
import {
  mapActivityCreatedIntegrationEvent,
  mapActivityOccurrenceScheduledIntegrationEvent,
  PostgresActivityOccurrenceRepository,
  PostgresActivityOccurrenceSchedulingFactsReader,
  PostgresActivityCreationFactsReader,
  PostgresActivityDetailsReader,
  PostgresActivityListReader,
  PostgresActivityRepository,
} from '@/modules/activities/infrastructure';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import type { PostgresPersistenceBuilder } from '../persistence';
import { defineService } from '../services';

export const activityUnitOfWork =
  defineService<UnitOfWork<ActivityWriteScope>>('activities.unit-of-work');
export const activityCreationFacts = defineService<ActivityCreationFactsReader>(
  'activities.creation-facts',
);
export const activityListReader = defineService<ActivityListReader>('activities.list-reader');
export const activityDetailsReader = defineService<ActivityDetailsReader>(
  'activities.details-reader',
);
export const activityOccurrenceUnitOfWork = defineService<UnitOfWork<ActivityOccurrenceWriteScope>>(
  'activities.occurrence-unit-of-work',
);
export const activityOccurrenceSchedulingFacts =
  defineService<ActivityOccurrenceSchedulingFactsReader>('activities.occurrence-scheduling-facts');

export function registerActivitiesPersistence(builder: PostgresPersistenceBuilder): void {
  builder.integrationEvents.register<ActivityCreated>(
    'activity.created',
    mapActivityCreatedIntegrationEvent,
  );
  builder.integrationEvents.register<ActivityOccurrenceScheduled>(
    'activity_occurrence.scheduled',
    mapActivityOccurrenceScheduledIntegrationEvent,
  );
  builder.addWriteScope(activityUnitOfWork, (client) => ({
    activities: new PostgresActivityRepository(client),
  }));
  builder.addValue(activityCreationFacts, (pool) => new PostgresActivityCreationFactsReader(pool));
  builder.addValue(activityListReader, (pool) => new PostgresActivityListReader(pool));
  builder.addValue(activityDetailsReader, (pool) => new PostgresActivityDetailsReader(pool));
  builder.addWriteScope(activityOccurrenceUnitOfWork, (client) => ({
    activityOccurrences: new PostgresActivityOccurrenceRepository(client),
  }));
  builder.addValue(
    activityOccurrenceSchedulingFacts,
    (pool) => new PostgresActivityOccurrenceSchedulingFactsReader(pool),
  );
}
