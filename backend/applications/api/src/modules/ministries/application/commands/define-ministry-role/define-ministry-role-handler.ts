import { OrganizationId, type OrganizationIdError } from '@/modules/organizations/domain';
import type { Clock } from '@/shared/application/clock';
import type { ExecutionContext } from '@/shared/application/context';
import type { IdGenerator } from '@/shared/application/id-generator';
import { createLogRecord, LogLevels, type Logger } from '@/shared/application/logging';
import { createEventEnvelope, type MessageId } from '@/shared/application/messaging';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import { combineValidationResults, type ValidationErrors } from '@/shared/application/validation';
import { failure, success, type Result } from '@/shared/core/result';
import type { DomainEventId } from '@/shared/domain/domain-event';
import {
  MinistryId,
  MinistryRoleName,
  type MinistryIdError,
  type MinistryRoleDefinitionError,
  type MinistryRoleId,
  type MinistryRoleNameError,
} from '../../../domain';
import type { MinistryWriteScope } from '../../ports';
import type { DefineMinistryRoleCommand } from './define-ministry-role-command';
import {
  DefineMinistryRoleErrorCodes,
  type DefineMinistryRoleNotFoundError,
} from './define-ministry-role-error';

export interface DefineMinistryRoleOutput {
  readonly ministryRoleId: MinistryRoleId;
  readonly ministryId: MinistryId;
  readonly organizationId: OrganizationId;
  readonly name: string;
  readonly status: 'active';
}
type DefineMinistryRoleError =
  | OrganizationIdError
  | MinistryIdError
  | MinistryRoleNameError
  | MinistryRoleDefinitionError
  | DefineMinistryRoleNotFoundError
  | ValidationErrors;
export class DefineMinistryRoleHandler {
  constructor(
    private readonly dependencies: {
      clock: Clock;
      ministryRoleIdGenerator: IdGenerator<MinistryRoleId>;
      domainEventIdGenerator: IdGenerator<DomainEventId>;
      messageIdGenerator: IdGenerator<MessageId>;
      unitOfWork: UnitOfWork<MinistryWriteScope>;
      logger: Logger;
    },
  ) {}

  async handle(
    command: DefineMinistryRoleCommand,
    context: ExecutionContext,
  ): Promise<Result<DefineMinistryRoleOutput, DefineMinistryRoleError>> {
    this.log('ministry_role.definition.started', context, {});
    const validated = combineValidationResults(
      OrganizationId.create(command.organizationId),
      MinistryId.create(command.ministryId),
      MinistryRoleName.create(command.name),
    );
    if (!validated.success) return validated;
    const [organizationId, ministryId, name] = validated.value;

    const transaction = await this.dependencies.unitOfWork.execute(async (scope) => {
      await scope.writeLock.acquireMinistry(organizationId, ministryId);
      const ministry = await scope.ministries.findById(organizationId, ministryId);
      if (ministry === undefined) {
        return {
          result: this.reject(context, {
            code: DefineMinistryRoleErrorCodes.MinistryNotFound,
            field: 'ministryId',
          }),
        };
      }
      const defined = ministry.defineRole({
        id: this.dependencies.ministryRoleIdGenerator.generate(),
        name: name.toString(),
        eventId: this.dependencies.domainEventIdGenerator.generate(),
        occurredAt: this.dependencies.clock.now(),
      });
      if (!defined.success) return { result: this.reject(context, defined.error) };
      const events = ministry.pendingDomainEvents;
      await scope.ministries.save(ministry);
      await scope.outbox.add(
        events.map((event) =>
          createEventEnvelope({
            messageId: this.dependencies.messageIdGenerator.generate(),
            correlationId: context.correlationId,
            event,
          }),
        ),
      );
      return {
        ministry,
        events,
        result: success(
          Object.freeze({
            ministryRoleId: defined.value.id,
            ministryId: ministry.id,
            organizationId: ministry.organizationId,
            name: defined.value.name.toString(),
            status: 'active' as const,
          }),
        ),
      };
    });
    if (!transaction.result.success) return transaction.result;
    transaction.ministry?.acknowledgeDomainEvents(transaction.events ?? []);
    this.log('ministry_role.definition.completed', context, {
      'organization.id': organizationId.value,
      'ministry.id': ministryId.value,
      'ministry_role.id': transaction.result.value.ministryRoleId.value,
    });
    return transaction.result;
  }

  private log(
    eventName: string,
    context: ExecutionContext,
    attributes: Record<string, string>,
  ): void {
    this.dependencies.logger.log(
      createLogRecord({ level: LogLevels.Info, eventName, context, attributes }),
    );
  }

  private reject<TError extends { readonly code: string; readonly field?: string }>(
    context: ExecutionContext,
    error: TError,
  ): Result<never, TError> {
    this.log('ministry_role.definition.rejected', context, {
      'error.code': error.code,
      ...(error.field === undefined ? {} : { 'error.field': error.field }),
    });
    return failure(error);
  }
}
