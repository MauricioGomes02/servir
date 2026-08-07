import { CreateMinistryHandler, DefineMinistryRoleHandler } from '@/modules/ministries/application';
import { MinistryCreationPolicy, MinistryId, MinistryRoleId } from '@/modules/ministries/domain';
import {
  CreateMinistryPresenter,
  DefineMinistryRolePresenter,
} from '@/modules/ministries/presentation';
import { UuidV7Generator } from '@/shared/infrastructure/id-generator';
import { asFunction } from 'awilix';

import type { ApplicationContainer, ApplicationCradle } from '../container';
import type { CreateApplicationOptions } from '../create-application-options';

export function registerMinistriesModule(
  container: ApplicationContainer,
  options: CreateApplicationOptions,
): void {
  container.register({
    ministryIdGenerator: asFunction(
      () => new UuidV7Generator(MinistryId.create, options.uuidSource),
    ).singleton(),
    ministryRoleIdGenerator: asFunction(
      () => new UuidV7Generator(MinistryRoleId.create, options.uuidSource),
    ).singleton(),
    createMinistryHandler: asFunction(
      (dependencies: ApplicationCradle) =>
        new CreateMinistryHandler({
          clock: dependencies.clock,
          ministryIdGenerator: dependencies.ministryIdGenerator,
          domainEventIdGenerator: dependencies.domainEventIdGenerator,
          messageIdGenerator: dependencies.messageIdGenerator,
          creationFacts: dependencies.ministryCreationFacts,
          creationPolicy: new MinistryCreationPolicy(),
          unitOfWork: dependencies.ministryUnitOfWork,
          logger: dependencies.logger,
        }),
    ).singleton(),
    createMinistryPresenter: asFunction(
      (dependencies: ApplicationCradle) => new CreateMinistryPresenter(dependencies.translator),
    ).singleton(),
    defineMinistryRoleHandler: asFunction(
      (dependencies: ApplicationCradle) =>
        new DefineMinistryRoleHandler({
          clock: dependencies.clock,
          ministryRoleIdGenerator: dependencies.ministryRoleIdGenerator,
          domainEventIdGenerator: dependencies.domainEventIdGenerator,
          messageIdGenerator: dependencies.messageIdGenerator,
          unitOfWork: dependencies.ministryUnitOfWork,
          logger: dependencies.logger,
        }),
    ).singleton(),
    defineMinistryRolePresenter: asFunction(
      (dependencies: ApplicationCradle) => new DefineMinistryRolePresenter(dependencies.translator),
    ).singleton(),
  });
}
