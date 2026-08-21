import { MemberId, type MemberIdError } from '@/modules/membership/domain';
import { OrganizationId, type OrganizationIdError } from '@/modules/organizations/domain';
import type { Clock } from '@/shared/application/clock';
import type { ExecutionContext } from '@/shared/application/context';
import type { IdGenerator } from '@/shared/application/id-generator';
import { createLogRecord, LogLevels, type Logger } from '@/shared/application/logging';
import { createEventEnvelope, type MessageId } from '@/shared/application/messaging';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import { combineValidationResults, type ValidationErrors } from '@/shared/application/validation';
import { success, type Result } from '@/shared/core/result';
import type { DomainEventId } from '@/shared/domain/domain-event';
import {
  MinistryId,
  MinistryMembership,
  type MinistryIdError,
  type MinistryMembershipId,
  type MinistryMembershipRequestPolicy,
  type MinistryMembershipRequestPolicyError,
} from '../../../domain';
import type { MinistryMembershipWriteScope } from '../../ports';
import type { RequestMinistryMembershipCommand } from './request-ministry-membership-command';

export interface RequestMinistryMembershipOutput {
  readonly ministryMembershipId: MinistryMembershipId;
  readonly organizationId: OrganizationId;
  readonly ministryId: MinistryId;
  readonly memberId: MemberId;
  readonly status: 'requested';
}
type RequestMinistryMembershipError =
  | OrganizationIdError
  | MinistryIdError
  | MemberIdError
  | MinistryMembershipRequestPolicyError
  | ValidationErrors;

export interface RequestMinistryMembershipDependencies {
  readonly clock: Clock;
  readonly ministryMembershipIdGenerator: IdGenerator<MinistryMembershipId>;
  readonly domainEventIdGenerator: IdGenerator<DomainEventId>;
  readonly messageIdGenerator: IdGenerator<MessageId>;
  readonly policy: MinistryMembershipRequestPolicy;
  readonly unitOfWork: UnitOfWork<MinistryMembershipWriteScope>;
  readonly logger: Logger;
}

export class RequestMinistryMembershipHandler {
  constructor(private readonly dependencies: RequestMinistryMembershipDependencies) {}

  async handle(
    command: RequestMinistryMembershipCommand,
    context: ExecutionContext,
  ): Promise<Result<RequestMinistryMembershipOutput, RequestMinistryMembershipError>> {
    const validated = combineValidationResults(
      OrganizationId.create(command.organizationId),
      MinistryId.create(command.ministryId),
      MemberId.create(command.memberId),
    );
    if (!validated.success) return validated;
    const [organizationId, ministryId, memberId] = validated.value;

    const transaction = await this.dependencies.unitOfWork.execute(async (scope) => {
      await scope.writeLock.acquireRequest(organizationId, ministryId, memberId);
      const facts = await scope.membershipRequestFacts.findFor(
        organizationId,
        ministryId,
        memberId,
      );
      const permission = this.dependencies.policy.evaluate(facts);
      if (!permission.success) return permission;

      const membership = MinistryMembership.request({
        id: this.dependencies.ministryMembershipIdGenerator.generate(),
        organizationId,
        ministryId,
        memberId,
        eventId: this.dependencies.domainEventIdGenerator.generate(),
        requestedAt: this.dependencies.clock.now(),
      });
      const events = membership.pendingDomainEvents;
      await scope.ministryMemberships.add(membership);
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
          membership,
          output: Object.freeze({
            ministryMembershipId: membership.id,
            organizationId: membership.organizationId,
            ministryId: membership.ministryId,
            memberId: membership.memberId,
            status: 'requested' as const,
          }),
        }),
      );
    });
    if (!transaction.success) return transaction;
    transaction.value.membership.acknowledgeDomainEvents(transaction.value.events);
    this.dependencies.logger.log(
      createLogRecord({
        level: LogLevels.Info,
        eventName: 'ministry_membership.request.completed',
        context,
        attributes: {
          'organization.id': organizationId.value.toString(),
          'ministry.id': ministryId.value.toString(),
          'member.id': memberId.value.toString(),
          'ministry_membership.id': transaction.value.membership.id.toString(),
        },
      }),
    );
    return success(transaction.value.output);
  }
}
