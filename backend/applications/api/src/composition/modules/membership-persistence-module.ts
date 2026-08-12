import type {
  MemberDetailsReader,
  MemberListReader,
  MemberWriteScope,
  OrganizationRegistrationFactsReader,
} from '@/modules/membership/application';
import type { MemberRegistered } from '@/modules/membership/domain';
import {
  mapMemberRegisteredIntegrationEvent,
  PostgresMemberDetailsReader,
  PostgresMemberListReader,
  PostgresMemberRepository,
  PostgresOrganizationRegistrationFactsReader,
} from '@/modules/membership/infrastructure';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import type { PostgresPersistenceBuilder } from '../persistence';
import { defineService } from '../services';

export const memberUnitOfWork =
  defineService<UnitOfWork<MemberWriteScope>>('membership.unit-of-work');
export const memberDetailsReader = defineService<MemberDetailsReader>(
  'membership.member-details-reader',
);
export const memberListReader = defineService<MemberListReader>('membership.member-list-reader');
export const organizationRegistrationFacts = defineService<OrganizationRegistrationFactsReader>(
  'membership.organization-registration-facts',
);
export function registerMembershipPersistence(builder: PostgresPersistenceBuilder): void {
  builder.integrationEvents.register<MemberRegistered>(
    'member.registered',
    mapMemberRegisteredIntegrationEvent,
  );
  builder.addWriteScope(memberUnitOfWork, (client) => ({
    members: new PostgresMemberRepository(client),
  }));
  builder.addValue(memberDetailsReader, (pool) => new PostgresMemberDetailsReader(pool));
  builder.addValue(memberListReader, (pool) => new PostgresMemberListReader(pool));
  builder.addValue(
    organizationRegistrationFacts,
    (pool) => new PostgresOrganizationRegistrationFactsReader(pool),
  );
}
