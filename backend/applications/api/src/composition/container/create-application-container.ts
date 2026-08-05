import { createContainer, InjectionMode } from 'awilix';

import type { CreateApplicationOptions } from '../create-application-options';
import type { ApplicationContainer, ApplicationCradle } from './application-container';
import { registerCoreDependencies } from '../modules/register-core-dependencies';
import { registerMembershipModule } from '../modules/register-membership-module';
import { registerOrganizationsModule } from '../modules/register-organizations-module';
import { registerPersistence } from '../persistence/register-persistence';

export function createApplicationContainer(
  options: CreateApplicationOptions,
): ApplicationContainer {
  const container = createContainer<ApplicationCradle>({
    injectionMode: InjectionMode.PROXY,
    strict: true,
  });

  registerCoreDependencies(container, options);
  registerPersistence(container, options);
  registerOrganizationsModule(container, options);
  registerMembershipModule(container, options);

  return container;
}
