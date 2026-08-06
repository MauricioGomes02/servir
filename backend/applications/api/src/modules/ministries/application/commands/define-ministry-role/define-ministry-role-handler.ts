import { OrganizationId, type OrganizationIdError } from '@/modules/organizations/domain';
import type { Clock } from '@/shared/application/clock';
import type { ExecutionContext } from '@/shared/application/context';
import type { IdGenerator } from '@/shared/application/id-generator';
import { createLogRecord, LogLevels, type Logger } from '@/shared/application/logging';
import { createEventEnvelope, type MessageId } from '@/shared/application/messaging';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import { failure, success, type Result } from '@/shared/core/result';
import type { DomainEventId } from '@/shared/domain/domain-event';
import { MinistryId, type MinistryIdError, type MinistryRoleDefinitionError, type MinistryRoleId, type MinistryRoleNameError } from '../../../domain';
import type { MinistryWriteScope } from '../../ports';
import type { DefineMinistryRoleCommand } from './define-ministry-role-command';
import { DefineMinistryRoleErrorCodes, type DefineMinistryRoleNotFoundError } from './define-ministry-role-error';

export interface DefineMinistryRoleOutput {
  readonly ministryRoleId: MinistryRoleId; readonly ministryId: MinistryId;
  readonly organizationId: OrganizationId; readonly name: string; readonly status: 'active';
}
type DefineMinistryRoleError = OrganizationIdError | MinistryIdError | MinistryRoleNameError
  | MinistryRoleDefinitionError | DefineMinistryRoleNotFoundError;
export class DefineMinistryRoleHandler {
  constructor(private readonly dependencies: {
    clock: Clock; ministryRoleIdGenerator: IdGenerator<MinistryRoleId>;
    domainEventIdGenerator: IdGenerator<DomainEventId>; messageIdGenerator: IdGenerator<MessageId>;
    unitOfWork: UnitOfWork<MinistryWriteScope>; logger: Logger;
  }) {}

  async handle(command: DefineMinistryRoleCommand, context: ExecutionContext): Promise<Result<DefineMinistryRoleOutput, DefineMinistryRoleError>> {
    this.log('ministry_role.definition.started', context, {});
    const organizationId = OrganizationId.create(command.organizationId);
    if (!organizationId.success) return this.reject(context, organizationId.error);
    const ministryId = MinistryId.create(command.ministryId);
    if (!ministryId.success) return this.reject(context, ministryId.error);

    const transaction = await this.dependencies.unitOfWork.execute(async (scope) => {
      const ministry = await scope.ministries.findById(organizationId.value, ministryId.value);
      if (ministry === undefined) {
        return { result: this.reject(context, { code: DefineMinistryRoleErrorCodes.MinistryNotFound, field: 'ministryId' }) };
      }
      const defined = ministry.defineRole({
        id: this.dependencies.ministryRoleIdGenerator.generate(), name: command.name,
        eventId: this.dependencies.domainEventIdGenerator.generate(), occurredAt: this.dependencies.clock.now(),
      });
      if (!defined.success) return { result: this.reject(context, defined.error) };
      const events = ministry.pendingDomainEvents;
      const saved = await scope.ministries.save(ministry);
      if (!saved.success) return { result: this.reject(context, saved.error) };
      await scope.outbox.add(events.map((event) => createEventEnvelope({
        messageId: this.dependencies.messageIdGenerator.generate(), correlationId: context.correlationId, event,
      })));
      return { ministry, events, result: success(Object.freeze({
        ministryRoleId: defined.value.id, ministryId: ministry.id, organizationId: ministry.organizationId,
        name: defined.value.name.toString(), status: 'active' as const,
      })) };
    });
    if (!transaction.result.success) return transaction.result;
    transaction.ministry?.acknowledgeDomainEvents(transaction.events ?? []);
    this.log('ministry_role.definition.completed', context, {
      'organization.id': organizationId.value.value, 'ministry.id': ministryId.value.value,
      'ministry_role.id': transaction.result.value.ministryRoleId.value,
    });
    return transaction.result;
  }

  private log(eventName: string, context: ExecutionContext, attributes: Record<string, string>): void {
    this.dependencies.logger.log(createLogRecord({ level: LogLevels.Info, eventName, context, attributes }));
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
