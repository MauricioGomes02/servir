import type {
  AvailabilityRequestOpeningFactsReader,
  AvailabilityRequestWriteScope,
} from '@/modules/availability/application';
import type { AvailabilityRequestOpened } from '@/modules/availability/domain';
import {
  mapAvailabilityRequestOpenedIntegrationEvent,
  PostgresAvailabilityRequestOpeningFactsReader,
  PostgresAvailabilityRequestRepository,
} from '@/modules/availability/infrastructure';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import type { PostgresPersistenceBuilder } from '../persistence';
import { defineService } from '../services';

export const availabilityRequestUnitOfWork = defineService<
  UnitOfWork<AvailabilityRequestWriteScope>
>('availability.request-unit-of-work');
export const availabilityRequestOpeningFacts = defineService<AvailabilityRequestOpeningFactsReader>(
  'availability.request-opening-facts',
);

export function registerAvailabilityPersistence(builder: PostgresPersistenceBuilder): void {
  builder.integrationEvents.register<AvailabilityRequestOpened>(
    'availability_request.opened',
    mapAvailabilityRequestOpenedIntegrationEvent,
  );
  builder.addWriteScope(availabilityRequestUnitOfWork, (client) => ({
    availabilityRequests: new PostgresAvailabilityRequestRepository(client),
  }));
  builder.addValue(
    availabilityRequestOpeningFacts,
    (pool) => new PostgresAvailabilityRequestOpeningFactsReader(pool),
  );
}
