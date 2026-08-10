import { OrganizationId, type OrganizationIdError } from '@/modules/organizations/domain';
import type { Clock } from '@/shared/application/clock';
import type { ExecutionContext } from '@/shared/application/context';
import type { IdGenerator } from '@/shared/application/id-generator';
import { createEventEnvelope, type MessageId } from '@/shared/application/messaging';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import { success, type Result } from '@/shared/core/result';
import type { DomainEventId } from '@/shared/domain/domain-event';
import {
  MinistryId,
  MinistryMembershipId,
  MinistryTeamId,
  TeamMembership,
  type MinistryIdError,
  type MinistryMembershipIdError,
  type MinistryTeamIdError,
  type TeamMembershipAssignmentPolicy,
  type TeamMembershipAssignmentPolicyError,
  type TeamMembershipId,
  type TeamMembershipIdError,
} from '../../../domain';
import type { TeamMembershipAssignmentFactsReader, TeamMembershipWriteScope } from '../../ports';
import type { AssignMemberToTeamCommand } from './assign-member-to-team-command';
export interface AssignMemberToTeamOutput {
  readonly teamMembershipId: TeamMembershipId;
  readonly organizationId: OrganizationId;
  readonly ministryId: MinistryId;
  readonly ministryTeamId: MinistryTeamId;
  readonly ministryMembershipId: MinistryMembershipId;
  readonly status: 'active';
  readonly assignedAt: string;
}
export type AssignMemberToTeamError =
  | OrganizationIdError
  | MinistryIdError
  | MinistryTeamIdError
  | MinistryMembershipIdError
  | TeamMembershipIdError
  | TeamMembershipAssignmentPolicyError;
export class AssignMemberToTeamHandler {
  constructor(
    private readonly dependencies: {
      clock: Clock;
      teamMembershipIdGenerator: IdGenerator<TeamMembershipId>;
      domainEventIdGenerator: IdGenerator<DomainEventId>;
      messageIdGenerator: IdGenerator<MessageId>;
      facts: TeamMembershipAssignmentFactsReader;
      policy: TeamMembershipAssignmentPolicy;
      unitOfWork: UnitOfWork<TeamMembershipWriteScope>;
    },
  ) {}
  async handle(
    command: AssignMemberToTeamCommand,
    context: ExecutionContext,
  ): Promise<Result<AssignMemberToTeamOutput, AssignMemberToTeamError>> {
    const organizationId = OrganizationId.create(command.organizationId);
    if (!organizationId.success) return organizationId;
    const ministryId = MinistryId.create(command.ministryId);
    if (!ministryId.success) return ministryId;
    const teamId = MinistryTeamId.create(command.ministryTeamId);
    if (!teamId.success) return teamId;
    const ministryMembershipId = MinistryMembershipId.create(command.ministryMembershipId);
    if (!ministryMembershipId.success) return ministryMembershipId;
    const permission = this.dependencies.policy.evaluate(
      await this.dependencies.facts.find(
        organizationId.value,
        ministryId.value,
        teamId.value,
        ministryMembershipId.value,
      ),
    );
    if (!permission.success) return permission;
    const assignedAt = this.dependencies.clock.now();
    const membership = TeamMembership.assign({
      id: this.dependencies.teamMembershipIdGenerator.generate(),
      organizationId: organizationId.value,
      ministryId: ministryId.value,
      ministryTeamId: teamId.value,
      ministryMembershipId: ministryMembershipId.value,
      eventId: this.dependencies.domainEventIdGenerator.generate(),
      assignedAt,
    });
    const events = membership.pendingDomainEvents;
    const persisted = await this.dependencies.unitOfWork.execute(async (scope) => {
      const added = await scope.teamMemberships.add(membership);
      if (!added.success) return added;
      await scope.outbox.add(
        events.map((event) =>
          createEventEnvelope({
            messageId: this.dependencies.messageIdGenerator.generate(),
            correlationId: context.correlationId,
            event,
          }),
        ),
      );
      return success();
    });
    if (!persisted.success) return persisted;
    membership.acknowledgeDomainEvents(events);
    return success(
      Object.freeze({
        teamMembershipId: membership.id,
        organizationId: membership.organizationId,
        ministryId: membership.ministryId,
        ministryTeamId: membership.ministryTeamId,
        ministryMembershipId: membership.ministryMembershipId,
        status: 'active' as const,
        assignedAt: membership.assignedAt.toISOString(),
      }),
    );
  }
}
