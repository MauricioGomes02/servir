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
  MinistryMembershipId,
  type MinistryIdError,
  type MinistryMembershipApprovalError,
  type MinistryMembershipIdError,
} from '../../../domain';
import type { MinistryMembershipWriteScope } from '../../ports';
import type { ApproveMinistryMembershipCommand } from './approve-ministry-membership-command';
import {
  ApproveMinistryMembershipErrorCodes,
  type ApproveMinistryMembershipNotFoundError,
} from './approve-ministry-membership-error';

export interface ApproveMinistryMembershipOutput {
  readonly ministryMembershipId: MinistryMembershipId;
  readonly organizationId: OrganizationId;
  readonly ministryId: MinistryId;
  readonly status: 'active';
}
type ApproveMinistryMembershipError =
  | OrganizationIdError
  | MinistryIdError
  | MinistryMembershipIdError
  | MinistryMembershipApprovalError
  | ApproveMinistryMembershipNotFoundError
  | ValidationErrors;

export class ApproveMinistryMembershipHandler {
  constructor(
    private readonly dependencies: {
      clock: Clock;
      domainEventIdGenerator: IdGenerator<DomainEventId>;
      messageIdGenerator: IdGenerator<MessageId>;
      unitOfWork: UnitOfWork<MinistryMembershipWriteScope>;
      logger: Logger;
    },
  ) {}

  async handle(
    command: ApproveMinistryMembershipCommand,
    context: ExecutionContext,
  ): Promise<Result<ApproveMinistryMembershipOutput, ApproveMinistryMembershipError>> {
    const validated = combineValidationResults(
      OrganizationId.create(command.organizationId),
      MinistryId.create(command.ministryId),
      MinistryMembershipId.create(command.ministryMembershipId),
    );
    if (!validated.success) return validated;
    const [organizationId, ministryId, membershipId] = validated.value;
    const transaction = await this.dependencies.unitOfWork.execute(async (scope) => {
      const membership = await scope.ministryMemberships.findById(
        organizationId,
        ministryId,
        membershipId,
      );
      if (membership === undefined)
        return {
          result: failure({
            code: ApproveMinistryMembershipErrorCodes.MembershipNotFound,
            field: 'ministryMembershipId',
          }),
        };
      const approved = membership.approve({
        eventId: this.dependencies.domainEventIdGenerator.generate(),
        occurredAt: this.dependencies.clock.now(),
      });
      if (!approved.success) return { result: approved };
      const events = membership.pendingDomainEvents;
      await scope.ministryMemberships.save(membership);
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
        membership,
        events,
        result: success(
          Object.freeze({
            ministryMembershipId: membership.id,
            organizationId: membership.organizationId,
            ministryId: membership.ministryId,
            status: 'active' as const,
          }),
        ),
      };
    });
    if (!transaction.result.success) return transaction.result;
    transaction.membership?.acknowledgeDomainEvents(transaction.events ?? []);
    this.dependencies.logger.log(
      createLogRecord({
        level: LogLevels.Info,
        eventName: 'ministry_membership.approval.completed',
        context,
        attributes: {
          'organization.id': organizationId.value,
          'ministry.id': ministryId.value,
          'ministry_membership.id': membershipId.value,
        },
      }),
    );
    return transaction.result;
  }
}
