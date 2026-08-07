import {
  ApproveMinistryMembershipHandler,
  ApproveMinistryMembershipMessage,
  CreateMinistryHandler,
  CreateMinistryMessage,
  DefineMinistryRoleHandler,
  DefineMinistryRoleMessage,
  RequestMinistryMembershipHandler,
  RequestMinistryMembershipMessage,
} from '@/modules/ministries/application';
import {
  MinistryCreationPolicy,
  MinistryId,
  MinistryMembershipId,
  MinistryMembershipRequestPolicy,
  MinistryRoleId,
} from '@/modules/ministries/domain';
import {
  registerApproveMinistryMembershipRoute,
  registerCreateMinistryRoute,
  registerDefineMinistryRoleRoute,
  registerRequestMinistryMembershipRoute,
} from '@/modules/ministries/infrastructure';
import {
  ApproveMinistryMembershipPresenter,
  CreateMinistryPresenter,
  DefineMinistryRolePresenter,
  RequestMinistryMembershipPresenter,
} from '@/modules/ministries/presentation';
import { UuidV7Generator } from '@/shared/infrastructure/id-generator';
import type { ApplicationModule } from './application-module';

export const ministriesModule: ApplicationModule = {
  register(container, options) {
    const dependencies = container.cradle;
    const createMinistry = new CreateMinistryHandler({
      clock: dependencies.clock,
      ministryIdGenerator: new UuidV7Generator(MinistryId.create, options.uuidSource),
      domainEventIdGenerator: dependencies.domainEventIdGenerator,
      messageIdGenerator: dependencies.messageIdGenerator,
      creationFacts: dependencies.ministryCreationFacts,
      creationPolicy: new MinistryCreationPolicy(),
      unitOfWork: dependencies.ministryUnitOfWork,
      logger: dependencies.logger,
    });
    const defineMinistryRole = new DefineMinistryRoleHandler({
      clock: dependencies.clock,
      ministryRoleIdGenerator: new UuidV7Generator(MinistryRoleId.create, options.uuidSource),
      domainEventIdGenerator: dependencies.domainEventIdGenerator,
      messageIdGenerator: dependencies.messageIdGenerator,
      unitOfWork: dependencies.ministryUnitOfWork,
      logger: dependencies.logger,
    });
    const requestMembership = new RequestMinistryMembershipHandler({
      clock: dependencies.clock,
      ministryMembershipIdGenerator: new UuidV7Generator(
        MinistryMembershipId.create,
        options.uuidSource,
      ),
      domainEventIdGenerator: dependencies.domainEventIdGenerator,
      messageIdGenerator: dependencies.messageIdGenerator,
      facts: dependencies.ministryMembershipRequestFacts,
      policy: new MinistryMembershipRequestPolicy(),
      unitOfWork: dependencies.ministryMembershipUnitOfWork,
      logger: dependencies.logger,
    });
    const approveMembership = new ApproveMinistryMembershipHandler({
      clock: dependencies.clock,
      domainEventIdGenerator: dependencies.domainEventIdGenerator,
      messageIdGenerator: dependencies.messageIdGenerator,
      unitOfWork: dependencies.ministryMembershipUnitOfWork,
      logger: dependencies.logger,
    });
    dependencies.mediator.register(
      CreateMinistryMessage,
      createMinistry.handle.bind(createMinistry),
    );
    dependencies.mediator.register(
      DefineMinistryRoleMessage,
      defineMinistryRole.handle.bind(defineMinistryRole),
    );
    dependencies.mediator.register(
      RequestMinistryMembershipMessage,
      requestMembership.handle.bind(requestMembership),
    );
    dependencies.mediator.register(
      ApproveMinistryMembershipMessage,
      approveMembership.handle.bind(approveMembership),
    );
  },
  registerRoutes(app, container) {
    const dependencies = container.cradle;
    registerCreateMinistryRoute(app, {
      mediator: dependencies.mediator,
      presenter: new CreateMinistryPresenter(dependencies.translator),
      messageTranslator: dependencies.translator,
    });
    registerDefineMinistryRoleRoute(app, {
      mediator: dependencies.mediator,
      presenter: new DefineMinistryRolePresenter(dependencies.translator),
      messageTranslator: dependencies.translator,
    });
    registerRequestMinistryMembershipRoute(app, {
      mediator: dependencies.mediator,
      presenter: new RequestMinistryMembershipPresenter(dependencies.translator),
      messageTranslator: dependencies.translator,
    });
    registerApproveMinistryMembershipRoute(app, {
      mediator: dependencies.mediator,
      presenter: new ApproveMinistryMembershipPresenter(dependencies.translator),
      messageTranslator: dependencies.translator,
    });
  },
};
