import {
  AcceptMemberAccessInvitationHandler,
  AcceptMemberAccessInvitationMessage,
  InviteMemberToAccessHandler,
  InviteMemberToAccessMessage,
  ProvisionUserFromExternalIdentityHandler,
} from '@/modules/identity/application';
import { MemberAccessInvitationId, OrganizationAccessId, UserId } from '@/modules/identity/domain';
import {
  NodeMemberAccessInvitationTokenService,
  registerMemberAccessInvitationRoutes,
  registerOrganizationAccessGuard,
  registerProvisionUserRoute,
} from '@/modules/identity/infrastructure';
import {
  AcceptMemberAccessInvitationPresenter,
  InviteMemberToAccessPresenter,
} from '@/modules/identity/presentation';
import { UuidV7Generator } from '@/shared/infrastructure/id-generator';
import type { ApplicationModule } from './application-module';
import {
  memberAccessInvitationUnitOfWork,
  organizationAccessReader,
  userProvisioner,
} from '../persistence/identity-persistence-module';

export const identityModule: ApplicationModule = {
  register(container, options) {
    const dependencies = container.cradle;
    const tokenService = new NodeMemberAccessInvitationTokenService();
    dependencies.mediator.registerHandler(
      InviteMemberToAccessMessage,
      new InviteMemberToAccessHandler({
        clock: dependencies.clock,
        invitationIdGenerator: new UuidV7Generator(
          MemberAccessInvitationId.create,
          options.uuidSource,
        ),
        tokenDigester: tokenService,
        tokenGenerator: tokenService,
        unitOfWork: options.persistence.services.get(memberAccessInvitationUnitOfWork),
      }),
    );
    dependencies.mediator.registerHandler(
      AcceptMemberAccessInvitationMessage,
      new AcceptMemberAccessInvitationHandler({
        clock: dependencies.clock,
        organizationAccessIdGenerator: new UuidV7Generator(
          OrganizationAccessId.create,
          options.uuidSource,
        ),
        tokenDigester: tokenService,
        unitOfWork: options.persistence.services.get(memberAccessInvitationUnitOfWork),
      }),
    );
  },
  registerRoutes(app, container, options) {
    if (options.accessTokenVerifier !== undefined) {
      registerOrganizationAccessGuard(
        app,
        options.persistence.services.get(organizationAccessReader),
        container.cradle.translator,
      );
    }
    const dependencies = container.cradle;
    registerMemberAccessInvitationRoutes(app, {
      acceptPresenter: new AcceptMemberAccessInvitationPresenter(dependencies.translator),
      invitePresenter: new InviteMemberToAccessPresenter(dependencies.translator),
      mediator: dependencies.mediator,
      messageTranslator: dependencies.translator,
    });
    if (options.bootstrapAssertionVerifier !== undefined) {
      registerProvisionUserRoute(app, {
        bootstrapAssertionVerifier: options.bootstrapAssertionVerifier,
        messageTranslator: dependencies.translator,
        handler: new ProvisionUserFromExternalIdentityHandler({
          logger: dependencies.logger,
          userIdGenerator: new UuidV7Generator(UserId.create, options.uuidSource),
          users: options.persistence.services.get(userProvisioner),
        }),
      });
    }
  },
};
