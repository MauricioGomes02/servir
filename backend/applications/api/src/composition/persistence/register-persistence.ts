import {
  InMemoryMemberRepository,
  InMemoryMemberDetailsReader,
  InMemoryOrganizationRegistrationFactsReader,
} from '@/modules/membership/infrastructure';
import { InMemoryOrganizationRepository } from '@/modules/organizations/infrastructure';
import {
  InMemoryMinistryCreationFactsReader,
  InMemoryMinistryRepository,
  InMemoryMinistryMembershipRepository,
  InMemoryMinistryMembershipRequestFactsReader,
} from '@/modules/ministries/infrastructure';
import {
  InMemoryEventBus,
  InMemoryEventOutbox,
  InMemoryEventOutboxRelay,
} from '@/shared/infrastructure/messaging';
import { DirectUnitOfWork } from '@/shared/infrastructure/unit-of-work';
import { asValue } from 'awilix';

import { ApplicationPersistenceConfigurationError } from '../application-persistence-configuration-error';
import type { ApplicationContainer } from '../container';
import type { CreateApplicationOptions } from '../create-application-options';

function hasNoPersistenceOverrides(options: CreateApplicationOptions): boolean {
  return (
    options.organizationUnitOfWork === undefined &&
    options.memberUnitOfWork === undefined &&
    options.memberDetailsReader === undefined &&
    options.organizationRegistrationFacts === undefined &&
    options.ministryUnitOfWork === undefined &&
    options.ministryCreationFacts === undefined &&
    options.ministryMembershipUnitOfWork === undefined &&
    options.ministryMembershipRequestFacts === undefined
  );
}

export function registerPersistence(
  container: ApplicationContainer,
  options: CreateApplicationOptions,
): void {
  if (hasNoPersistenceOverrides(options)) {
    const organizations = new InMemoryOrganizationRepository();
    const members = new InMemoryMemberRepository();
    const ministries = new InMemoryMinistryRepository();
    const ministryMemberships = new InMemoryMinistryMembershipRepository();
    const outbox = new InMemoryEventOutbox();
    const relay = new InMemoryEventOutboxRelay(
      outbox,
      new InMemoryEventBus(),
      container.cradle.logger,
    );

    container.register({
      organizationUnitOfWork: asValue(new DirectUnitOfWork({ organizations, outbox })),
      memberUnitOfWork: asValue(new DirectUnitOfWork({ members, outbox })),
      ministryUnitOfWork: asValue(new DirectUnitOfWork({ ministries, outbox })),
      ministryMembershipUnitOfWork: asValue(new DirectUnitOfWork({ ministryMemberships, outbox })),
      memberDetailsReader: asValue(new InMemoryMemberDetailsReader(() => members.members)),
      organizationRegistrationFacts: asValue(
        new InMemoryOrganizationRegistrationFactsReader(() =>
          organizations.organizations.map((organization) => organization.id),
        ),
      ),
      ministryCreationFacts: asValue(
        new InMemoryMinistryCreationFactsReader(
          () => organizations.organizations.map((organization) => organization.id),
          () => ministries.ministries,
        ),
      ),
      ministryMembershipRequestFacts: asValue(
        new InMemoryMinistryMembershipRequestFactsReader(
          () => members.members,
          () => ministries.ministries,
          () => ministryMemberships.memberships,
        ),
      ),
      eventRelayLifecycle: asValue(Object.freeze({ relay })),
    });
    return;
  }

  if (
    options.organizationUnitOfWork === undefined ||
    options.memberUnitOfWork === undefined ||
    options.memberDetailsReader === undefined ||
    options.organizationRegistrationFacts === undefined ||
    options.ministryUnitOfWork === undefined ||
    options.ministryCreationFacts === undefined ||
    options.ministryMembershipUnitOfWork === undefined ||
    options.ministryMembershipRequestFacts === undefined
  ) {
    throw new ApplicationPersistenceConfigurationError();
  }

  container.register({
    organizationUnitOfWork: asValue(options.organizationUnitOfWork),
    memberUnitOfWork: asValue(options.memberUnitOfWork),
    memberDetailsReader: asValue(options.memberDetailsReader),
    organizationRegistrationFacts: asValue(options.organizationRegistrationFacts),
    ministryUnitOfWork: asValue(options.ministryUnitOfWork),
    ministryCreationFacts: asValue(options.ministryCreationFacts),
    ministryMembershipUnitOfWork: asValue(options.ministryMembershipUnitOfWork),
    ministryMembershipRequestFacts: asValue(options.ministryMembershipRequestFacts),
    eventRelayLifecycle: asValue(Object.freeze({})),
  });
}
