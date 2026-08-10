import {
  InMemoryEventBus,
  InMemoryEventOutbox,
  InMemoryEventOutboxRelay,
} from '@/shared/infrastructure/messaging';
import { DirectUnitOfWork } from '@/shared/infrastructure/unit-of-work';
import { InMemoryLogger } from '@/shared/infrastructure/logging';
import type { ApplicationPersistence } from '../persistence';
import {
  memberDetailsReader,
  memberUnitOfWork,
  organizationRegistrationFacts,
} from '../modules/membership-persistence-module';
import {
  ministryCreationFacts,
  ministryMembershipRequestFacts,
  ministryMembershipUnitOfWork,
  ministryUnitOfWork,
  ministryTeamCreationFacts,
  ministryTeamUnitOfWork,
} from '../modules/ministries-persistence-module';
import { organizationUnitOfWork } from '../modules/organizations-persistence-module';
import { ServiceRegistry } from '../services';
import {
  InMemoryMemberDetailsReader,
  InMemoryMemberRepository,
  InMemoryMinistryCreationFactsReader,
  InMemoryMinistryMembershipRepository,
  InMemoryMinistryMembershipRequestFactsReader,
  InMemoryMinistryRoleQualificationFactsReader,
  InMemoryMinistryRepository,
  InMemoryMinistryTeamCreationFactsReader,
  InMemoryMinistryTeamRepository,
  InMemoryOrganizationRegistrationFactsReader,
  InMemoryOrganizationRepository,
} from './persistence-doubles';

export function createTestPersistence(): ApplicationPersistence {
  const organizations = new InMemoryOrganizationRepository();
  const members = new InMemoryMemberRepository();
  const ministries = new InMemoryMinistryRepository();
  const ministryMemberships = new InMemoryMinistryMembershipRepository();
  const ministryTeams = new InMemoryMinistryTeamRepository();
  const outbox = new InMemoryEventOutbox();
  const eventRelay = new InMemoryEventOutboxRelay(
    outbox,
    new InMemoryEventBus(),
    new InMemoryLogger(),
  );
  const services = new ServiceRegistry();
  services.add(organizationUnitOfWork, new DirectUnitOfWork({ organizations, outbox }));
  services.add(memberUnitOfWork, new DirectUnitOfWork({ members, outbox }));
  services.add(memberDetailsReader, new InMemoryMemberDetailsReader(() => members.members));
  services.add(
    organizationRegistrationFacts,
    new InMemoryOrganizationRegistrationFactsReader(() =>
      organizations.organizations.map(({ id }) => id),
    ),
  );
  services.add(ministryUnitOfWork, new DirectUnitOfWork({ ministries, outbox }));
  services.add(
    ministryCreationFacts,
    new InMemoryMinistryCreationFactsReader(
      () => organizations.organizations.map(({ id }) => id),
      () => ministries.ministries,
    ),
  );
  services.add(
    ministryMembershipUnitOfWork,
    new DirectUnitOfWork({
      ministryMemberships,
      ministryRoleQualificationFacts: new InMemoryMinistryRoleQualificationFactsReader(
        () => ministries.ministries,
      ),
      outbox,
    }),
  );
  services.add(
    ministryMembershipRequestFacts,
    new InMemoryMinistryMembershipRequestFactsReader(
      () => members.members,
      () => ministries.ministries,
      () => ministryMemberships.memberships,
    ),
  );
  services.add(ministryTeamUnitOfWork, new DirectUnitOfWork({ ministryTeams, outbox }));
  services.add(
    ministryTeamCreationFacts,
    new InMemoryMinistryTeamCreationFactsReader(
      () => ministries.ministries,
      () => ministryTeams.teams,
    ),
  );

  return {
    services,
    eventRelay,
    async close() {},
  };
}
