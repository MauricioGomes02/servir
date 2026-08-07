import { MemberId, type MemberIdError } from '@/modules/membership/domain';
import { OrganizationId, type OrganizationIdError } from '@/modules/organizations/domain';
import type { Clock } from '@/shared/application/clock';
import type { ExecutionContext } from '@/shared/application/context';
import type { IdGenerator } from '@/shared/application/id-generator';
import { createLogRecord, LogLevels, type Logger } from '@/shared/application/logging';
import { createEventEnvelope, type MessageId } from '@/shared/application/messaging';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
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
import type {
  MinistryMembershipRequestFactsReader,
  MinistryMembershipWriteScope,
} from '../../ports';
import type { RequestMinistryMembershipCommand } from './request-ministry-membership-command';

export interface RequestMinistryMembershipOutput {
  readonly ministryMembershipId: MinistryMembershipId;
  readonly organizationId: OrganizationId;
  readonly ministryId: MinistryId;
  readonly memberId: MemberId;
  readonly status: 'requested';
}
type RequestMinistryMembershipError =
  OrganizationIdError | MinistryIdError | MemberIdError | MinistryMembershipRequestPolicyError;

export interface RequestMinistryMembershipDependencies {
  readonly clock: Clock;
  readonly ministryMembershipIdGenerator: IdGenerator<MinistryMembershipId>;
  readonly domainEventIdGenerator: IdGenerator<DomainEventId>;
  readonly messageIdGenerator: IdGenerator<MessageId>;
  readonly facts: MinistryMembershipRequestFactsReader;
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
    const organizationId = OrganizationId.create(command.organizationId);
    if (!organizationId.success) return organizationId;
    const ministryId = MinistryId.create(command.ministryId);
    if (!ministryId.success) return ministryId;
    const memberId = MemberId.create(command.memberId);
    if (!memberId.success) return memberId;

    const facts = await this.dependencies.facts.findFor(
      organizationId.value,
      ministryId.value,
      memberId.value,
    );
    const permission = this.dependencies.policy.evaluate(facts);
    if (!permission.success) return permission;

    const membership = MinistryMembership.request({
      id: this.dependencies.ministryMembershipIdGenerator.generate(),
      organizationId: organizationId.value,
      ministryId: ministryId.value,
      memberId: memberId.value,
      eventId: this.dependencies.domainEventIdGenerator.generate(),
      requestedAt: this.dependencies.clock.now(),
    });
    const pendingEvents = membership.pendingDomainEvents;
    const envelopes = pendingEvents.map((event) =>
      createEventEnvelope({
        messageId: this.dependencies.messageIdGenerator.generate(),
        correlationId: context.correlationId,
        event,
      }),
    );
    const persisted = await this.dependencies.unitOfWork.execute(async (scope) => {
      const added = await scope.ministryMemberships.add(membership);
      if (!added.success) return added;
      await scope.outbox.add(envelopes);
      return success();
    });
    if (!persisted.success) return persisted;
    membership.acknowledgeDomainEvents(pendingEvents);
    this.dependencies.logger.log(
      createLogRecord({
        level: LogLevels.Info,
        eventName: 'ministry_membership.request.completed',
        context,
        attributes: {
          'organization.id': organizationId.value.toString(),
          'ministry.id': ministryId.value.toString(),
          'member.id': memberId.value.toString(),
          'ministry_membership.id': membership.id.toString(),
        },
      }),
    );
    return success(
      Object.freeze({
        ministryMembershipId: membership.id,
        organizationId: membership.organizationId,
        ministryId: membership.ministryId,
        memberId: membership.memberId,
        status: 'requested',
      }),
    );
  }
}
