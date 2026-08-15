import type { ExecutionContext } from '@/shared/application/context';
import type { IdGenerator } from '@/shared/application/id-generator';
import { createLogRecord, LogLevels, type Logger } from '@/shared/application/logging';
import { failure, success, type Result } from '@/shared/core/result';

import {
  ExternalIdentity,
  User,
  type ExternalIdentityValidationError,
  type UserId,
} from '../domain';
import type { UserProvisioner } from './user-provisioner';

export const ProvisionUserErrorCodes = {
  Unauthenticated: 'identity.user_provisioning.unauthenticated',
} as const;

export interface ProvisionUserError {
  readonly code: (typeof ProvisionUserErrorCodes)[keyof typeof ProvisionUserErrorCodes];
}

export interface ProvisionUserOutput {
  readonly created: boolean;
  readonly userId: UserId;
}

export interface ProvisionUserDependencies {
  readonly logger: Logger;
  readonly userIdGenerator: IdGenerator<UserId>;
  readonly users: UserProvisioner;
}

export class ProvisionUserFromExternalIdentityHandler {
  constructor(private readonly dependencies: ProvisionUserDependencies) {}

  async handle(
    context: ExecutionContext,
  ): Promise<Result<ProvisionUserOutput, ProvisionUserError | ExternalIdentityValidationError>> {
    if (context.actor === undefined) {
      return failure({ code: ProvisionUserErrorCodes.Unauthenticated });
    }

    const externalIdentity = ExternalIdentity.create(context.actor);
    if (!externalIdentity.success) return externalIdentity;

    const candidate = User.provision(
      this.dependencies.userIdGenerator.generate(),
      externalIdentity.value,
    );
    const result = await this.dependencies.users.provision(candidate);

    this.dependencies.logger.log(
      createLogRecord({
        level: LogLevels.Info,
        eventName: result.created ? 'identity.user.provisioned' : 'identity.user.resolved',
        context,
        attributes: { 'user.id': result.user.id.toString() },
      }),
    );

    return success(Object.freeze({ created: result.created, userId: result.user.id }));
  }
}
