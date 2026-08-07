import { asValue } from 'awilix';
import type { ApplicationContainer } from '../container';
import type { ApplicationPersistence } from './application-persistence';

export function registerPersistence(
  container: ApplicationContainer,
  persistence: ApplicationPersistence,
): void {
  container.register({
    organizationUnitOfWork: asValue(persistence.organizationUnitOfWork),
    memberUnitOfWork: asValue(persistence.memberUnitOfWork),
    memberDetailsReader: asValue(persistence.memberDetailsReader),
    organizationRegistrationFacts: asValue(persistence.organizationRegistrationFacts),
    ministryUnitOfWork: asValue(persistence.ministryUnitOfWork),
    ministryCreationFacts: asValue(persistence.ministryCreationFacts),
    ministryMembershipUnitOfWork: asValue(persistence.ministryMembershipUnitOfWork),
    ministryMembershipRequestFacts: asValue(persistence.ministryMembershipRequestFacts),
    eventRelayLifecycle: asValue(Object.freeze({ relay: persistence.eventRelay })),
  });
}
