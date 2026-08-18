import type { Clock } from '@/shared/application/clock';
import type { ExecutionContext } from '@/shared/application/context';
import type { IdGenerator } from '@/shared/application/id-generator';
import {
  createLogRecord,
  LogLevels,
  type Logger,
  type LogAttributes,
  type LogLevel,
} from '@/shared/application/logging';
import { createEventEnvelope, type MessageId } from '@/shared/application/messaging';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import { success, type Result } from '@/shared/core/result';
import type { DomainEventId } from '@/shared/domain/domain-event';
import { OrganizationAccess, type OrganizationAccessId, UserId } from '@/modules/identity/domain';

import { Organization, type OrganizationId, type OrganizationNameError } from '../../../domain';
import type { OrganizationWriteScope } from '../../ports';
import type { CreateOrganizationCommand } from './create-organization-command';

export interface CreateOrganizationOutput {
  readonly organizationId: OrganizationId;
  readonly name: string;
}

export interface CreateOrganizationAuthenticationError {
  readonly code: 'organization.creation.authenticated_actor_required';
}
export type CreateOrganizationError = OrganizationNameError | CreateOrganizationAuthenticationError;

export interface CreateOrganizationDependencies {
  readonly clock: Clock;
  readonly organizationIdGenerator: IdGenerator<OrganizationId>;
  readonly organizationAccessIdGenerator: IdGenerator<OrganizationAccessId>;
  readonly domainEventIdGenerator: IdGenerator<DomainEventId>;
  readonly messageIdGenerator: IdGenerator<MessageId>;
  readonly unitOfWork: UnitOfWork<OrganizationWriteScope>;
  readonly logger: Logger;
}

export class CreateOrganizationHandler {
  constructor(private readonly dependencies: CreateOrganizationDependencies) {}

  async handle(
    command: CreateOrganizationCommand,
    context: ExecutionContext,
  ): Promise<Result<CreateOrganizationOutput, CreateOrganizationError>> {
    this.log(LogLevels.Debug, 'organization.creation.started', context, {});

    const userId = UserId.create(context.actor?.userId);
    if (!userId.success) {
      return {
        success: false,
        error: { code: 'organization.creation.authenticated_actor_required' },
      };
    }

    const organization = Organization.create({
      id: this.dependencies.organizationIdGenerator.generate(),
      name: command.name,
      eventId: this.dependencies.domainEventIdGenerator.generate(),
      occurredAt: this.dependencies.clock.now(),
    });

    if (!organization.success) {
      this.log(LogLevels.Info, 'organization.creation.rejected', context, {
        'error.code': organization.error.code,
        'error.field': organization.error.field ?? 'name',
      });
      return organization;
    }

    const pendingEvents = organization.value.pendingDomainEvents;
    const ownerAccess = OrganizationAccess.grantOwner({
      id: this.dependencies.organizationAccessIdGenerator.generate(),
      organizationId: organization.value.id,
      userId: userId.value,
    });
    this.log(LogLevels.Debug, 'organization.creation.validated', context, {
      'organization.id': organization.value.id.value,
      'domain_event.count': pendingEvents.length,
    });
    const envelopes = pendingEvents.map((event) =>
      createEventEnvelope({
        messageId: this.dependencies.messageIdGenerator.generate(),
        correlationId: context.correlationId,
        event,
      }),
    );

    await this.dependencies.unitOfWork.execute(async (scope) => {
      await scope.organizations.save(organization.value);
      await scope.organizationAccesses.add(ownerAccess);
      await scope.outbox.add(envelopes);
    });

    this.log(LogLevels.Info, 'organization.creation.persisted', context, {
      'organization.id': organization.value.id.value,
      'domain_event.count': pendingEvents.length,
    });

    organization.value.acknowledgeDomainEvents(pendingEvents);

    this.log(LogLevels.Info, 'organization.creation.completed', context, {
      'organization.id': organization.value.id.value,
    });

    return success(
      Object.freeze({
        organizationId: organization.value.id,
        name: organization.value.name.toString(),
      }),
    );
  }

  private log(
    level: LogLevel,
    eventName: string,
    context: ExecutionContext,
    attributes: LogAttributes,
  ): void {
    this.dependencies.logger.log(
      createLogRecord({
        level,
        eventName,
        context,
        attributes,
      }),
    );
  }
}
