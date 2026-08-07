import { createContainer, InjectionMode } from 'awilix';

import type { CreateApplicationOptions } from '../create-application-options';
import type { ApplicationContainer, ApplicationCradle } from './application-container';
import { registerCoreDependencies } from '../modules/register-core-dependencies';
import { applicationModules } from '../modules';
import { registerPersistence } from '../persistence/register-persistence';

export function createApplicationContainer(
  options: CreateApplicationOptions,
): ApplicationContainer {
  const container = createContainer<ApplicationCradle>({
    injectionMode: InjectionMode.PROXY,
    strict: true,
  });

  registerCoreDependencies(container, options);
  registerPersistence(container, options.persistence);
  for (const module of applicationModules) module.register(container, options);

  return container;
}
