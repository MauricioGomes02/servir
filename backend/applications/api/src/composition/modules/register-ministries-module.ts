import {
  ApproveMinistryMembershipHandler,
  ApproveMinistryMembershipMessage,
  CreateMinistryHandler,
  CreateMinistryMessage,
  DefineMinistryRoleHandler,
  DefineMinistryRoleMessage,
  RequestMinistryMembershipHandler,
  RequestMinistryMembershipMessage,
  QualifyMemberForMinistryRoleHandler,
  QualifyMemberForMinistryRoleMessage,
  CreateMinistryTeamHandler,
  CreateMinistryTeamMessage,
  AssignMemberToTeamHandler,
  AssignMemberToTeamMessage,
} from '@/modules/ministries/application';
import {
  MinistryCreationPolicy,
  MinistryId,
  MinistryMembershipId,
  MinistryMembershipRequestPolicy,
  MinistryRoleId,
  MinistryRoleQualificationId,
  MinistryRoleQualificationPolicy,
  MinistryTeamCreationPolicy,
  MinistryTeamId,
  TeamMembershipAssignmentPolicy,
  TeamMembershipId,
} from '@/modules/ministries/domain';
import {
  registerApproveMinistryMembershipRoute,
  registerCreateMinistryRoute,
  registerDefineMinistryRoleRoute,
  registerRequestMinistryMembershipRoute,
  registerQualifyMemberForMinistryRoleRoute,
  registerCreateMinistryTeamRoute,
  registerAssignMemberToTeamRoute,
} from '@/modules/ministries/infrastructure';
import {
  ApproveMinistryMembershipPresenter,
  CreateMinistryPresenter,
  DefineMinistryRolePresenter,
  RequestMinistryMembershipPresenter,
  QualifyMemberForMinistryRolePresenter,
  CreateMinistryTeamPresenter,
  AssignMemberToTeamPresenter,
} from '@/modules/ministries/presentation';
import { UuidV7Generator } from '@/shared/infrastructure/id-generator';
import type { ApplicationModule } from './application-module';
import {
  ministryCreationFacts,
  ministryMembershipRequestFacts,
  ministryMembershipUnitOfWork,
  ministryUnitOfWork,
  ministryTeamCreationFacts,
  ministryTeamUnitOfWork,
  teamMembershipAssignmentFacts,
  teamMembershipUnitOfWork,
} from './ministries-persistence-module';

export const ministriesModule: ApplicationModule = {
  register(container, options) {
    const dependencies = container.cradle;
    const createMinistry = new CreateMinistryHandler({
      clock: dependencies.clock,
      ministryIdGenerator: new UuidV7Generator(MinistryId.create, options.uuidSource),
      domainEventIdGenerator: dependencies.domainEventIdGenerator,
      messageIdGenerator: dependencies.messageIdGenerator,
      creationFacts: options.persistence.services.get(ministryCreationFacts),
      creationPolicy: new MinistryCreationPolicy(),
      unitOfWork: options.persistence.services.get(ministryUnitOfWork),
      logger: dependencies.logger,
    });
    const defineMinistryRole = new DefineMinistryRoleHandler({
      clock: dependencies.clock,
      ministryRoleIdGenerator: new UuidV7Generator(MinistryRoleId.create, options.uuidSource),
      domainEventIdGenerator: dependencies.domainEventIdGenerator,
      messageIdGenerator: dependencies.messageIdGenerator,
      unitOfWork: options.persistence.services.get(ministryUnitOfWork),
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
      facts: options.persistence.services.get(ministryMembershipRequestFacts),
      policy: new MinistryMembershipRequestPolicy(),
      unitOfWork: options.persistence.services.get(ministryMembershipUnitOfWork),
      logger: dependencies.logger,
    });
    const approveMembership = new ApproveMinistryMembershipHandler({
      clock: dependencies.clock,
      domainEventIdGenerator: dependencies.domainEventIdGenerator,
      messageIdGenerator: dependencies.messageIdGenerator,
      unitOfWork: options.persistence.services.get(ministryMembershipUnitOfWork),
      logger: dependencies.logger,
    });
    const qualifyMemberForRole = new QualifyMemberForMinistryRoleHandler({
      clock: dependencies.clock,
      qualificationIdGenerator: new UuidV7Generator(
        MinistryRoleQualificationId.create,
        options.uuidSource,
      ),
      domainEventIdGenerator: dependencies.domainEventIdGenerator,
      messageIdGenerator: dependencies.messageIdGenerator,
      policy: new MinistryRoleQualificationPolicy(),
      unitOfWork: options.persistence.services.get(ministryMembershipUnitOfWork),
      logger: dependencies.logger,
    });
    const createMinistryTeam = new CreateMinistryTeamHandler({
      clock: dependencies.clock,
      ministryTeamIdGenerator: new UuidV7Generator(MinistryTeamId.create, options.uuidSource),
      domainEventIdGenerator: dependencies.domainEventIdGenerator,
      messageIdGenerator: dependencies.messageIdGenerator,
      facts: options.persistence.services.get(ministryTeamCreationFacts),
      policy: new MinistryTeamCreationPolicy(),
      unitOfWork: options.persistence.services.get(ministryTeamUnitOfWork),
    });
    const assignMemberToTeam = new AssignMemberToTeamHandler({
      clock: dependencies.clock,
      teamMembershipIdGenerator: new UuidV7Generator(TeamMembershipId.create, options.uuidSource),
      domainEventIdGenerator: dependencies.domainEventIdGenerator,
      messageIdGenerator: dependencies.messageIdGenerator,
      facts: options.persistence.services.get(teamMembershipAssignmentFacts),
      policy: new TeamMembershipAssignmentPolicy(),
      unitOfWork: options.persistence.services.get(teamMembershipUnitOfWork),
    });
    dependencies.mediator.registerHandler(CreateMinistryMessage, createMinistry);
    dependencies.mediator.registerHandler(DefineMinistryRoleMessage, defineMinistryRole);
    dependencies.mediator.registerHandler(RequestMinistryMembershipMessage, requestMembership);
    dependencies.mediator.registerHandler(ApproveMinistryMembershipMessage, approveMembership);
    dependencies.mediator.registerHandler(
      QualifyMemberForMinistryRoleMessage,
      qualifyMemberForRole,
    );
    dependencies.mediator.registerHandler(CreateMinistryTeamMessage, createMinistryTeam);
    dependencies.mediator.registerHandler(AssignMemberToTeamMessage, assignMemberToTeam);
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
    registerQualifyMemberForMinistryRoleRoute(app, {
      mediator: dependencies.mediator,
      presenter: new QualifyMemberForMinistryRolePresenter(dependencies.translator),
      messageTranslator: dependencies.translator,
    });
    registerCreateMinistryTeamRoute(app, {
      mediator: dependencies.mediator,
      presenter: new CreateMinistryTeamPresenter(dependencies.translator),
      messageTranslator: dependencies.translator,
    });
    registerAssignMemberToTeamRoute(app, {
      mediator: dependencies.mediator,
      presenter: new AssignMemberToTeamPresenter(dependencies.translator),
      messageTranslator: dependencies.translator,
    });
  },
};
