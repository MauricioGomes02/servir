import { ProvisionUserFromExternalIdentityHandler } from '@/modules/identity/application';
import { UserId } from '@/modules/identity/domain';
import {
  registerOrganizationAccessGuard,
  registerProvisionUserRoute,
} from '@/modules/identity/infrastructure';
import { UuidV7Generator } from '@/shared/infrastructure/id-generator';
import type { ApplicationModule } from './application-module';
import {
  organizationAccessReader,
  userProvisioner,
} from '../persistence/identity-persistence-module';

export const identityModule: ApplicationModule = {
  register() {},
  registerRoutes(app, container, options) {
    if (options.accessTokenVerifier !== undefined) {
      registerOrganizationAccessGuard(
        app,
        options.persistence.services.get(organizationAccessReader),
        container.cradle.translator,
      );
    }
    if (options.bootstrapAssertionVerifier === undefined) return;
    const dependencies = container.cradle;
    registerProvisionUserRoute(app, {
      bootstrapAssertionVerifier: options.bootstrapAssertionVerifier,
      messageTranslator: dependencies.translator,
      handler: new ProvisionUserFromExternalIdentityHandler({
        logger: dependencies.logger,
        userIdGenerator: new UuidV7Generator(UserId.create, options.uuidSource),
        users: options.persistence.services.get(userProvisioner),
      }),
    });
  },
};
