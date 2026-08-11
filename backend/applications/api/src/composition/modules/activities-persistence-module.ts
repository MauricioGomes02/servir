import type {
  ActivityCreationFactsReader,
  ActivityWriteScope,
} from '@/modules/activities/application';
import type { ActivityCreated } from '@/modules/activities/domain';
import {
  mapActivityCreatedIntegrationEvent,
  PostgresActivityCreationFactsReader,
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

export function registerActivitiesPersistence(builder: PostgresPersistenceBuilder): void {
  builder.integrationEvents.register<ActivityCreated>(
    'activity.created',
    mapActivityCreatedIntegrationEvent,
  );
  builder.addWriteScope(activityUnitOfWork, (client) => ({
    activities: new PostgresActivityRepository(client),
  }));
  builder.addValue(activityCreationFacts, (pool) => new PostgresActivityCreationFactsReader(pool));
}
