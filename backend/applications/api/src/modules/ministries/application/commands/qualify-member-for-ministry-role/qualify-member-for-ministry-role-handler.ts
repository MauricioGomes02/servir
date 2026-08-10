import { OrganizationId, type OrganizationIdError } from '@/modules/organizations/domain';
import type { Clock } from '@/shared/application/clock';
import type { ExecutionContext } from '@/shared/application/context';
import type { IdGenerator } from '@/shared/application/id-generator';
import { createEventEnvelope, type MessageId } from '@/shared/application/messaging';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import { failure, success, type Result } from '@/shared/core/result';
import type { DomainEventId } from '@/shared/domain/domain-event';
import type { Logger } from '@/shared/application/logging';
import {
  MinistryId,
  MinistryMembershipId,
  MinistryRoleId,
  type MinistryRoleQualificationId,
  type MinistryIdError,
  type MinistryMembershipIdError,
  type MinistryRoleIdError,
  type MinistryRoleQualificationError,
  type MinistryRoleQualificationIdError,
  type MinistryRoleQualificationPolicy,
} from '../../../domain';
import type { MinistryMembershipWriteScope } from '../../ports';
import type { QualifyMemberForMinistryRoleCommand } from './qualify-member-for-ministry-role-command';
import {
  QualifyMemberForMinistryRoleErrorCodes,
  type QualifyMemberForMinistryRoleNotFoundError,
} from './qualify-member-for-ministry-role-error';
export interface QualifyMemberForMinistryRoleOutput {
  readonly ministryRoleQualificationId: MinistryRoleQualificationId;
  readonly ministryMembershipId: MinistryMembershipId;
  readonly organizationId: OrganizationId;
  readonly ministryId: MinistryId;
  readonly ministryRoleId: MinistryRoleId;
  readonly status: 'active';
  readonly qualifiedAt: string;
}
export type QualifyMemberForMinistryRoleError =
  | OrganizationIdError
  | MinistryIdError
  | MinistryMembershipIdError
  | MinistryRoleIdError
  | MinistryRoleQualificationIdError
  | MinistryRoleQualificationError
  | QualifyMemberForMinistryRoleNotFoundError;
export class QualifyMemberForMinistryRoleHandler {
  constructor(
    private readonly dependencies: {
      clock: Clock;
      qualificationIdGenerator: IdGenerator<MinistryRoleQualificationId>;
      domainEventIdGenerator: IdGenerator<DomainEventId>;
      messageIdGenerator: IdGenerator<MessageId>;
      policy: MinistryRoleQualificationPolicy;
      unitOfWork: UnitOfWork<MinistryMembershipWriteScope>;
      logger: Logger;
    },
  ) {}
  async handle(
    command: QualifyMemberForMinistryRoleCommand,
    context: ExecutionContext,
  ): Promise<Result<QualifyMemberForMinistryRoleOutput, QualifyMemberForMinistryRoleError>> {
    const organizationId = OrganizationId.create(command.organizationId);
    if (!organizationId.success) return organizationId;
    const ministryId = MinistryId.create(command.ministryId);
    if (!ministryId.success) return ministryId;
    const membershipId = MinistryMembershipId.create(command.ministryMembershipId);
    if (!membershipId.success) return membershipId;
    const roleId = MinistryRoleId.create(command.ministryRoleId);
    if (!roleId.success) return roleId;
    const transaction = await this.dependencies.unitOfWork.execute(async (scope) => {
      const membership = await scope.ministryMemberships.findById(
        organizationId.value,
        ministryId.value,
        membershipId.value,
      );
      if (!membership)
        return {
          result: failure({
            code: QualifyMemberForMinistryRoleErrorCodes.MembershipNotFound,
            field: 'ministryMembershipId',
          }),
        };
      const checked = this.dependencies.policy.evaluate({
        membershipIsActive: membership.status === 'active',
        roleIsActive: await scope.ministryRoleQualificationFacts.isRoleActive(
          organizationId.value,
          ministryId.value,
          roleId.value,
        ),
        activeQualificationExists: membership.roleQualifications.some(
          (item) => item.ministryRoleId.equals(roleId.value) && item.status === 'active',
        ),
      });
      if (!checked.success) return { result: checked };
      const qualified = membership.qualifyForRole({
        id: this.dependencies.qualificationIdGenerator.generate(),
        ministryRoleId: roleId.value,
        eventId: this.dependencies.domainEventIdGenerator.generate(),
        occurredAt: this.dependencies.clock.now(),
      });
      if (!qualified.success) return { result: qualified };
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
        result: success({
          ministryRoleQualificationId: qualified.value.id,
          ministryMembershipId: membership.id,
          organizationId: membership.organizationId,
          ministryId: membership.ministryId,
          ministryRoleId: qualified.value.ministryRoleId,
          status: 'active' as const,
          qualifiedAt: qualified.value.qualifiedAt.toISOString(),
        }),
      };
    });
    if (transaction.result.success)
      transaction.membership?.acknowledgeDomainEvents(transaction.events ?? []);
    return transaction.result;
  }
}
