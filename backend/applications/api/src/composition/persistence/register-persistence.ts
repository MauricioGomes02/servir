import {
  InMemoryMemberRepository,
  InMemoryOrganizationRegistrationFactsReader,
} from '@/modules/membership/infrastructure';
import { InMemoryOrganizationRepository } from '@/modules/organizations/infrastructure';
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
  return options.organizationUnitOfWork === undefined
    && options.memberUnitOfWork === undefined
    && options.organizationRegistrationFacts === undefined;
}

export function registerPersistence(
  container: ApplicationContainer,
  options: CreateApplicationOptions,
): void {
  if (hasNoPersistenceOverrides(options)) {
    const organizations = new InMemoryOrganizationRepository();
    const members = new InMemoryMemberRepository();
    const outbox = new InMemoryEventOutbox();
    const relay = new InMemoryEventOutboxRelay(
      outbox,
      new InMemoryEventBus(),
      container.cradle.logger,
    );

    container.register({
      organizationUnitOfWork: asValue(
        new DirectUnitOfWork({ organizations, outbox }),
      ),
      memberUnitOfWork: asValue(
        new DirectUnitOfWork({ members, outbox }),
      ),
      organizationRegistrationFacts: asValue(
        new InMemoryOrganizationRegistrationFactsReader(
          () => organizations.organizations.map(
            (organization) => organization.id,
          ),
        ),
      ),
      eventRelayLifecycle: asValue(Object.freeze({ relay })),
    });
    return;
  }

  if (
    options.organizationUnitOfWork === undefined
    || options.memberUnitOfWork === undefined
    || options.organizationRegistrationFacts === undefined
  ) {
    throw new ApplicationPersistenceConfigurationError();
  }

  container.register({
    organizationUnitOfWork: asValue(options.organizationUnitOfWork),
    memberUnitOfWork: asValue(options.memberUnitOfWork),
    organizationRegistrationFacts: asValue(
      options.organizationRegistrationFacts,
    ),
    eventRelayLifecycle: asValue(Object.freeze({})),
  });
}
