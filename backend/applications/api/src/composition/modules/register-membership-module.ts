import { RegisterMemberHandler } from '@/modules/membership/application';
import { MemberId, MemberRegistrationPolicy } from '@/modules/membership/domain';
import { RegisterMemberPresenter } from '@/modules/membership/presentation';
import { UuidV7Generator } from '@/shared/infrastructure/id-generator';
import { asFunction } from 'awilix';

import type { ApplicationContainer, ApplicationCradle } from '../container';
import type { CreateApplicationOptions } from '../create-application-options';

export function registerMembershipModule(
  container: ApplicationContainer,
  options: CreateApplicationOptions,
): void {
  container.register({
    memberIdGenerator: asFunction(() => new UuidV7Generator(
      MemberId.create,
      options.uuidSource,
    )).singleton(),
    registerMemberHandler: asFunction((dependencies: ApplicationCradle) => (
      new RegisterMemberHandler({
        clock: dependencies.clock,
        memberIdGenerator: dependencies.memberIdGenerator,
        domainEventIdGenerator: dependencies.domainEventIdGenerator,
        messageIdGenerator: dependencies.messageIdGenerator,
        organizationRegistrationFacts:
          dependencies.organizationRegistrationFacts,
        registrationPolicy: new MemberRegistrationPolicy(),
        unitOfWork: dependencies.memberUnitOfWork,
      })
    )).singleton(),
    registerMemberPresenter: asFunction((dependencies: ApplicationCradle) => (
      new RegisterMemberPresenter(dependencies.translator)
    )).singleton(),
  });
}
