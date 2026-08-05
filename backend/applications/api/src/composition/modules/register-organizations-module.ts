import { CreateOrganizationHandler } from '@/modules/organizations/application';
import { OrganizationId } from '@/modules/organizations/domain';
import { CreateOrganizationPresenter } from '@/modules/organizations/presentation';
import { UuidV7Generator } from '@/shared/infrastructure/id-generator';
import { asFunction } from 'awilix';

import type { ApplicationContainer, ApplicationCradle } from '../container';
import type { CreateApplicationOptions } from '../create-application-options';

export function registerOrganizationsModule(
  container: ApplicationContainer,
  options: CreateApplicationOptions,
): void {
  container.register({
    organizationIdGenerator: asFunction(() => new UuidV7Generator(
      OrganizationId.create,
      options.uuidSource,
    )).singleton(),
    createOrganizationHandler: asFunction((dependencies: ApplicationCradle) => (
      new CreateOrganizationHandler({
        clock: dependencies.clock,
        organizationIdGenerator: dependencies.organizationIdGenerator,
        domainEventIdGenerator: dependencies.domainEventIdGenerator,
        messageIdGenerator: dependencies.messageIdGenerator,
        unitOfWork: dependencies.organizationUnitOfWork,
        logger: dependencies.logger,
      })
    )).singleton(),
    createOrganizationPresenter: asFunction((dependencies: ApplicationCradle) => (
      new CreateOrganizationPresenter(dependencies.translator)
    )).singleton(),
  });
}
