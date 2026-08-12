import type {
  OrganizationDetailsReader,
  OrganizationWriteScope,
} from '@/modules/organizations/application';
import type { OrganizationCreated } from '@/modules/organizations/domain';
import {
  mapOrganizationCreatedIntegrationEvent,
  PostgresOrganizationRepository,
  PostgresOrganizationDetailsReader,
} from '@/modules/organizations/infrastructure';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import { defineService } from '../services';
import type { PostgresPersistenceBuilder } from '../persistence';

export const organizationUnitOfWork = defineService<UnitOfWork<OrganizationWriteScope>>(
  'organizations.unit-of-work',
);
export const organizationDetailsReader = defineService<OrganizationDetailsReader>(
  'organizations.details-reader',
);
export function registerOrganizationsPersistence(builder: PostgresPersistenceBuilder): void {
  builder.integrationEvents.register<OrganizationCreated>(
    'organization.created',
    mapOrganizationCreatedIntegrationEvent,
  );
  builder.addWriteScope(organizationUnitOfWork, (client) => ({
    organizations: new PostgresOrganizationRepository(client),
  }));
  builder.addValue(
    organizationDetailsReader,
    (pool) => new PostgresOrganizationDetailsReader(pool),
  );
}
