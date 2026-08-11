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
  MinistryTeamId,
  TeamLeadership,
  TeamMembershipId,
  type MinistryIdError,
  type MinistryTeamIdError,
  type TeamLeaderAppointmentPolicy,
  type TeamLeaderAppointmentPolicyError,
  type TeamLeadershipId,
  type TeamLeadershipIdError,
  type TeamMembershipIdError,
} from '../../../domain';
import type { TeamLeaderAppointmentFactsReader, TeamLeadershipWriteScope } from '../../ports';
import type { AppointTeamLeaderCommand } from './appoint-team-leader-command';

export interface AppointTeamLeaderOutput {
  readonly teamLeadershipId: TeamLeadershipId;
  readonly organizationId: OrganizationId;
  readonly ministryId: MinistryId;
  readonly ministryTeamId: MinistryTeamId;
  readonly teamMembershipId: TeamMembershipId;
  readonly status: 'active';
  readonly appointedAt: string;
}
export type AppointTeamLeaderError =
  | OrganizationIdError
  | MinistryIdError
  | MinistryTeamIdError
  | TeamMembershipIdError
  | TeamLeadershipIdError
  | TeamLeaderAppointmentPolicyError;

export class AppointTeamLeaderHandler {
  constructor(
    private readonly dependencies: {
      clock: Clock;
      teamLeadershipIdGenerator: IdGenerator<TeamLeadershipId>;
      domainEventIdGenerator: IdGenerator<DomainEventId>;
      messageIdGenerator: IdGenerator<MessageId>;
      facts: TeamLeaderAppointmentFactsReader;
      policy: TeamLeaderAppointmentPolicy;
      unitOfWork: UnitOfWork<TeamLeadershipWriteScope>;
    },
  ) {}

  async handle(
    command: AppointTeamLeaderCommand,
    context: ExecutionContext,
  ): Promise<Result<AppointTeamLeaderOutput, AppointTeamLeaderError>> {
    const organizationId = OrganizationId.create(command.organizationId);
    if (!organizationId.success) return organizationId;
    const ministryId = MinistryId.create(command.ministryId);
    if (!ministryId.success) return ministryId;
    const teamId = MinistryTeamId.create(command.ministryTeamId);
    if (!teamId.success) return teamId;
    const membershipId = TeamMembershipId.create(command.teamMembershipId);
    if (!membershipId.success) return membershipId;
    const permission = this.dependencies.policy.evaluate(
      await this.dependencies.facts.find(
        organizationId.value,
        ministryId.value,
        teamId.value,
        membershipId.value,
      ),
    );
    if (!permission.success) return permission;
    const appointedAt = this.dependencies.clock.now();
    const leadership = TeamLeadership.appoint({
      id: this.dependencies.teamLeadershipIdGenerator.generate(),
      organizationId: organizationId.value,
      ministryId: ministryId.value,
      ministryTeamId: teamId.value,
      teamMembershipId: membershipId.value,
      eventId: this.dependencies.domainEventIdGenerator.generate(),
      appointedAt,
    });
    const events = leadership.pendingDomainEvents;
    const persisted = await this.dependencies.unitOfWork.execute(async (scope) => {
      const added = await scope.teamLeaderships.add(leadership);
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
    leadership.acknowledgeDomainEvents(events);
    return success(
      Object.freeze({
        teamLeadershipId: leadership.id,
        organizationId: leadership.organizationId,
        ministryId: leadership.ministryId,
        ministryTeamId: leadership.ministryTeamId,
        teamMembershipId: leadership.teamMembershipId,
        status: 'active' as const,
        appointedAt: leadership.appointedAt.toISOString(),
      }),
    );
  }
}
