import { OrganizationId, type OrganizationIdError } from '@/modules/organizations/domain';
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
import { combineValidationResults, type ValidationErrors } from '@/shared/application/validation';
import { failure, success, type Result } from '@/shared/core/result';
import type { DomainEventId } from '@/shared/domain/domain-event';

import {
  Ministry,
  MinistryName,
  type MinistryId,
  type MinistryNameError,
  type MinistryCreationPolicy,
  type MinistryCreationPolicyError,
  type MinistryActiveNameConflictError,
} from '../../../domain';
import type { MinistryWriteScope } from '../../ports';
import type { CreateMinistryCommand } from './create-ministry-command';

export interface CreateMinistryOutput {
  readonly ministryId: MinistryId;
  readonly organizationId: OrganizationId;
  readonly name: string;
  readonly status: 'active';
}

export interface CreateMinistryDependencies {
  readonly clock: Clock;
  readonly ministryIdGenerator: IdGenerator<MinistryId>;
  readonly domainEventIdGenerator: IdGenerator<DomainEventId>;
  readonly messageIdGenerator: IdGenerator<MessageId>;
  readonly creationPolicy: MinistryCreationPolicy;
  readonly unitOfWork: UnitOfWork<MinistryWriteScope>;
  readonly logger: Logger;
}

type CreateMinistryError =
  | OrganizationIdError
  | MinistryNameError
  | MinistryCreationPolicyError
  | MinistryActiveNameConflictError
  | ValidationErrors;

export class CreateMinistryHandler {
  constructor(private readonly dependencies: CreateMinistryDependencies) {}

  async handle(
    command: CreateMinistryCommand,
    context: ExecutionContext,
  ): Promise<Result<CreateMinistryOutput, CreateMinistryError>> {
    this.log(LogLevels.Debug, 'ministry.creation.started', context, {});
    const validated = combineValidationResults(
      OrganizationId.create(command.organizationId),
      MinistryName.create(command.name),
    );
    if (!validated.success) return validated;
    const [organizationId, name] = validated.value;

    const transaction = await this.dependencies.unitOfWork.execute(async (scope) => {
      await scope.writeLock.acquireOrganization(organizationId);
      const facts = await scope.creationFacts.find(organizationId, name);
      const permission = this.dependencies.creationPolicy.evaluate(facts);
      if (!permission.success) return permission;

      this.log(LogLevels.Debug, 'ministry.creation.eligibility.accepted', context, {
        'organization.id': organizationId.value,
      });
      const ministry = Ministry.create({
        id: this.dependencies.ministryIdGenerator.generate(),
        organizationId,
        name: name.toString(),
        eventId: this.dependencies.domainEventIdGenerator.generate(),
        occurredAt: this.dependencies.clock.now(),
      });
      if (!ministry.success) return ministry;

      const events = ministry.value.pendingDomainEvents;
      this.log(LogLevels.Debug, 'ministry.creation.validated', context, {
        'organization.id': organizationId.value,
        'ministry.id': ministry.value.id.value,
        'domain_event.count': events.length,
      });
      await scope.ministries.add(ministry.value);
      await scope.outbox.add(
        events.map((event) =>
          createEventEnvelope({
            messageId: this.dependencies.messageIdGenerator.generate(),
            correlationId: context.correlationId,
            event,
          }),
        ),
      );
      return success(
        Object.freeze({
          events,
          ministry: ministry.value,
          output: Object.freeze({
            ministryId: ministry.value.id,
            organizationId: ministry.value.organizationId,
            name: ministry.value.name.toString(),
            status: 'active' as const,
          }),
        }),
      );
    });
    if (!transaction.success) {
      return this.reject(context, transaction.error, {
        'organization.id': organizationId.value,
      });
    }

    this.log(LogLevels.Info, 'ministry.creation.persisted', context, {
      'organization.id': organizationId.value,
      'ministry.id': transaction.value.ministry.id.value,
      'domain_event.count': transaction.value.events.length,
    });
    transaction.value.ministry.acknowledgeDomainEvents(transaction.value.events);
    this.log(LogLevels.Info, 'ministry.creation.completed', context, {
      'organization.id': organizationId.value,
      'ministry.id': transaction.value.ministry.id.value,
    });
    return success(transaction.value.output);
  }

  private reject<TError extends { readonly code: string; readonly field?: string }>(
    context: ExecutionContext,
    error: TError,
    attributes: LogAttributes = {},
  ): Result<never, TError> {
    this.log(LogLevels.Info, 'ministry.creation.rejected', context, {
      ...attributes,
      'error.code': error.code,
      ...(error.field === undefined ? {} : { 'error.field': error.field }),
    });
    return failure(error);
  }

  private log(
    level: LogLevel,
    eventName: string,
    context: ExecutionContext,
    attributes: LogAttributes,
  ): void {
    this.dependencies.logger.log(createLogRecord({ level, eventName, context, attributes }));
  }
}
