import type { Clock } from '@/shared/application/clock';
import type { ExecutionContext } from '@/shared/application/context';
import type { IdGenerator } from '@/shared/application/id-generator';
import {
  createEventEnvelope,
  type MessageId,
} from '@/shared/application/messaging';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import {
  success,
  type Result,
} from '@/shared/core/result';
import type { DomainEventId } from '@/shared/domain/domain-event';

import {
  Organization,
  type OrganizationId,
  type OrganizationNameError,
} from '../../../domain';
import type { OrganizationWriteScope } from '../../ports';
import type { CreateOrganizationCommand } from './create-organization-command';

export interface CreateOrganizationOutput {
  readonly organizationId: OrganizationId;
}

export interface CreateOrganizationDependencies {
  readonly clock: Clock;
  readonly organizationIdGenerator: IdGenerator<OrganizationId>;
  readonly domainEventIdGenerator: IdGenerator<DomainEventId>;
  readonly messageIdGenerator: IdGenerator<MessageId>;
  readonly unitOfWork: UnitOfWork<OrganizationWriteScope>;
}

export class CreateOrganizationHandler {
  constructor(
    private readonly dependencies: CreateOrganizationDependencies,
  ) {}

  async handle(
    command: CreateOrganizationCommand,
    context: ExecutionContext,
  ): Promise<Result<CreateOrganizationOutput, OrganizationNameError>> {
    const organization = Organization.create({
      id: this.dependencies.organizationIdGenerator.generate(),
      name: command.name,
      eventId: this.dependencies.domainEventIdGenerator.generate(),
      occurredAt: this.dependencies.clock.now(),
    });

    if (!organization.success) {
      return organization;
    }

    const pendingEvents = organization.value.pendingDomainEvents;
    const envelopes = pendingEvents.map((event) => createEventEnvelope({
      messageId: this.dependencies.messageIdGenerator.generate(),
      correlationId: context.correlationId,
      event,
    }));

    await this.dependencies.unitOfWork.execute(async (scope) => {
      await scope.organizations.save(organization.value);
      await scope.outbox.add(envelopes);
    });

    organization.value.acknowledgeDomainEvents(pendingEvents);

    return success(Object.freeze({
      organizationId: organization.value.id,
    }));
  }
}
