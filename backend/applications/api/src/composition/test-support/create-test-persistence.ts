import {
  InMemoryMemberDetailsReader,
  InMemoryMemberRepository,
  InMemoryOrganizationRegistrationFactsReader,
} from '@/modules/membership/infrastructure';
import {
  InMemoryMinistryCreationFactsReader,
  InMemoryMinistryMembershipRepository,
  InMemoryMinistryMembershipRequestFactsReader,
  InMemoryMinistryRepository,
} from '@/modules/ministries/infrastructure';
import { InMemoryOrganizationRepository } from '@/modules/organizations/infrastructure';
import {
  InMemoryEventBus,
  InMemoryEventOutbox,
  InMemoryEventOutboxRelay,
} from '@/shared/infrastructure/messaging';
import { DirectUnitOfWork } from '@/shared/infrastructure/unit-of-work';
import { InMemoryLogger } from '@/shared/infrastructure/logging';
import type { ApplicationPersistence } from '../persistence';

export function createTestPersistence(): ApplicationPersistence {
  const organizations = new InMemoryOrganizationRepository();
  const members = new InMemoryMemberRepository();
  const ministries = new InMemoryMinistryRepository();
  const ministryMemberships = new InMemoryMinistryMembershipRepository();
  const outbox = new InMemoryEventOutbox();
  const eventRelay = new InMemoryEventOutboxRelay(
    outbox,
    new InMemoryEventBus(),
    new InMemoryLogger(),
  );

  return {
    organizationUnitOfWork: new DirectUnitOfWork({ organizations, outbox }),
    memberUnitOfWork: new DirectUnitOfWork({ members, outbox }),
    memberDetailsReader: new InMemoryMemberDetailsReader(() => members.members),
    organizationRegistrationFacts: new InMemoryOrganizationRegistrationFactsReader(() =>
      organizations.organizations.map(({ id }) => id),
    ),
    ministryUnitOfWork: new DirectUnitOfWork({ ministries, outbox }),
    ministryCreationFacts: new InMemoryMinistryCreationFactsReader(
      () => organizations.organizations.map(({ id }) => id),
      () => ministries.ministries,
    ),
    ministryMembershipUnitOfWork: new DirectUnitOfWork({ ministryMemberships, outbox }),
    ministryMembershipRequestFacts: new InMemoryMinistryMembershipRequestFactsReader(
      () => members.members,
      () => ministries.ministries,
      () => ministryMemberships.memberships,
    ),
    eventRelay,
    async close() {},
  };
}
