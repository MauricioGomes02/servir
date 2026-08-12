import {
  GetMemberDetailsHandler,
  GetMemberDetailsMessage,
  ListMembersHandler,
  ListMembersMessage,
  RegisterMemberHandler,
  RegisterMemberMessage,
} from '@/modules/membership/application';
import { MemberId, MemberRegistrationPolicy } from '@/modules/membership/domain';
import {
  registerGetMemberDetailsRoute,
  registerListMembersRoute,
  registerMemberRoute,
} from '@/modules/membership/infrastructure';
import {
  GetMemberDetailsPresenter,
  ListMembersPresenter,
  RegisterMemberPresenter,
} from '@/modules/membership/presentation';
import { UuidV7Generator } from '@/shared/infrastructure/id-generator';
import type { ApplicationModule } from './application-module';
import {
  memberDetailsReader,
  memberListReader,
  memberUnitOfWork,
  organizationRegistrationFacts,
} from './membership-persistence-module';

export const membershipModule: ApplicationModule = {
  register(container, options) {
    const dependencies = container.cradle;
    const registerMember = new RegisterMemberHandler({
      clock: dependencies.clock,
      memberIdGenerator: new UuidV7Generator(MemberId.create, options.uuidSource),
      domainEventIdGenerator: dependencies.domainEventIdGenerator,
      messageIdGenerator: dependencies.messageIdGenerator,
      organizationRegistrationFacts: options.persistence.services.get(
        organizationRegistrationFacts,
      ),
      registrationPolicy: new MemberRegistrationPolicy(),
      unitOfWork: options.persistence.services.get(memberUnitOfWork),
      logger: dependencies.logger,
    });
    const getMemberDetails = new GetMemberDetailsHandler(
      options.persistence.services.get(memberDetailsReader),
      dependencies.logger,
    );
    const listMembers = new ListMembersHandler(options.persistence.services.get(memberListReader));
    dependencies.mediator.registerHandler(RegisterMemberMessage, registerMember);
    dependencies.mediator.registerHandler(GetMemberDetailsMessage, getMemberDetails);
    dependencies.mediator.registerHandler(ListMembersMessage, listMembers);
  },
  registerRoutes(app, container) {
    const dependencies = container.cradle;
    registerMemberRoute(app, {
      mediator: dependencies.mediator,
      messageTranslator: dependencies.translator,
      presenter: new RegisterMemberPresenter(dependencies.translator),
    });
    registerGetMemberDetailsRoute(app, {
      mediator: dependencies.mediator,
      messageTranslator: dependencies.translator,
      presenter: new GetMemberDetailsPresenter(dependencies.translator),
    });
    registerListMembersRoute(app, {
      mediator: dependencies.mediator,
      messageTranslator: dependencies.translator,
      presenter: new ListMembersPresenter(dependencies.translator),
    });
  },
};
