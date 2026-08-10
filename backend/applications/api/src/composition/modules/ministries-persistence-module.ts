import type {
  MinistryCreationFactsReader,
  MinistryMembershipRequestFactsReader,
  MinistryMembershipWriteScope,
  MinistryWriteScope,
} from '@/modules/ministries/application';
import type {
  MinistryCreated,
  MinistryMembershipApproved,
  MinistryMembershipRequested,
  MinistryRoleDefined,
  MemberQualifiedForMinistryRole,
} from '@/modules/ministries/domain';
import {
  mapMinistryCreatedIntegrationEvent,
  mapMinistryMembershipApprovedIntegrationEvent,
  mapMinistryMembershipRequestedIntegrationEvent,
  mapMinistryRoleDefinedIntegrationEvent,
  mapMemberQualifiedForMinistryRoleIntegrationEvent,
  PostgresMinistryCreationFactsReader,
  PostgresMinistryMembershipRepository,
  PostgresMinistryMembershipRequestFactsReader,
  PostgresMinistryRoleQualificationFactsReader,
  PostgresMinistryRepository,
} from '@/modules/ministries/infrastructure';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import type { PostgresPersistenceBuilder } from '../persistence';
import { defineService } from '../services';

export const ministryUnitOfWork =
  defineService<UnitOfWork<MinistryWriteScope>>('ministries.unit-of-work');
export const ministryCreationFacts = defineService<MinistryCreationFactsReader>(
  'ministries.creation-facts',
);
export const ministryMembershipUnitOfWork = defineService<UnitOfWork<MinistryMembershipWriteScope>>(
  'ministries.membership-unit-of-work',
);
export const ministryMembershipRequestFacts = defineService<MinistryMembershipRequestFactsReader>(
  'ministries.membership-request-facts',
);
export function registerMinistriesPersistence(builder: PostgresPersistenceBuilder): void {
  builder.integrationEvents.register<MinistryCreated>(
    'ministry.created',
    mapMinistryCreatedIntegrationEvent,
  );
  builder.integrationEvents.register<MinistryRoleDefined>(
    'ministry.role_defined',
    mapMinistryRoleDefinedIntegrationEvent,
  );
  builder.integrationEvents.register<MinistryMembershipRequested>(
    'ministry_membership.requested',
    mapMinistryMembershipRequestedIntegrationEvent,
  );
  builder.integrationEvents.register<MinistryMembershipApproved>(
    'ministry_membership.approved',
    mapMinistryMembershipApprovedIntegrationEvent,
  );
  builder.integrationEvents.register<MemberQualifiedForMinistryRole>(
    'member.qualified_for_ministry_role',
    mapMemberQualifiedForMinistryRoleIntegrationEvent,
  );
  builder.addWriteScope(ministryUnitOfWork, (client) => ({
    ministries: new PostgresMinistryRepository(client),
  }));
  builder.addWriteScope(ministryMembershipUnitOfWork, (client) => ({
    ministryMemberships: new PostgresMinistryMembershipRepository(client),
    ministryRoleQualificationFacts: new PostgresMinistryRoleQualificationFactsReader(client),
  }));
  builder.addValue(ministryCreationFacts, (pool) => new PostgresMinistryCreationFactsReader(pool));
  builder.addValue(
    ministryMembershipRequestFacts,
    (pool) => new PostgresMinistryMembershipRequestFactsReader(pool),
  );
}
