import { OrganizationId, type OrganizationIdError } from '@/modules/organizations/domain';
import type { Clock } from '@/shared/application/clock';
import type { ExecutionContext } from '@/shared/application/context';
import type { IdGenerator } from '@/shared/application/id-generator';
import { createEventEnvelope, type MessageId } from '@/shared/application/messaging';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import { combineValidationResults, type ValidationErrors } from '@/shared/application/validation';
import { success, type Result } from '@/shared/core/result';
import type { DomainEventId } from '@/shared/domain/domain-event';
import {
  MinistryId,
  MinistryTeam,
  MinistryTeamName,
  type MinistryIdError,
  type MinistryTeamCreationPolicy,
  type MinistryTeamCreationPolicyError,
  type MinistryTeamId,
  type MinistryTeamNameError,
} from '../../../domain';
import type { MinistryTeamCreationFactsReader, MinistryTeamWriteScope } from '../../ports';
import type { CreateMinistryTeamCommand } from './create-ministry-team-command';
export interface CreateMinistryTeamOutput {
  readonly ministryTeamId: MinistryTeamId;
  readonly organizationId: OrganizationId;
  readonly ministryId: MinistryId;
  readonly name: string;
  readonly status: 'active';
}
export type CreateMinistryTeamError =
  | OrganizationIdError
  | MinistryIdError
  | MinistryTeamNameError
  | MinistryTeamCreationPolicyError
  | ValidationErrors;
export class CreateMinistryTeamHandler {
  constructor(
    private readonly dependencies: {
      clock: Clock;
      ministryTeamIdGenerator: IdGenerator<MinistryTeamId>;
      domainEventIdGenerator: IdGenerator<DomainEventId>;
      messageIdGenerator: IdGenerator<MessageId>;
      facts: MinistryTeamCreationFactsReader;
      policy: MinistryTeamCreationPolicy;
      unitOfWork: UnitOfWork<MinistryTeamWriteScope>;
    },
  ) {}
  async handle(
    command: CreateMinistryTeamCommand,
    context: ExecutionContext,
  ): Promise<Result<CreateMinistryTeamOutput, CreateMinistryTeamError>> {
    const validated = combineValidationResults(
      OrganizationId.create(command.organizationId),
      MinistryId.create(command.ministryId),
      MinistryTeamName.create(command.name),
    );
    if (!validated.success) return validated;
    const [organizationId, ministryId, name] = validated.value;
    const permission = this.dependencies.policy.evaluate(
      await this.dependencies.facts.find(organizationId, ministryId, name),
    );
    if (!permission.success) return permission;
    const team = MinistryTeam.create({
      id: this.dependencies.ministryTeamIdGenerator.generate(),
      organizationId,
      ministryId,
      name: name.toString(),
      eventId: this.dependencies.domainEventIdGenerator.generate(),
      occurredAt: this.dependencies.clock.now(),
    });
    if (!team.success) return team;
    const events = team.value.pendingDomainEvents;
    const persisted = await this.dependencies.unitOfWork.execute(async (scope) => {
      const added = await scope.ministryTeams.add(team.value);
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
    team.value.acknowledgeDomainEvents(events);
    return success(
      Object.freeze({
        ministryTeamId: team.value.id,
        organizationId: team.value.organizationId,
        ministryId: team.value.ministryId,
        name: team.value.name.toString(),
        status: 'active' as const,
      }),
    );
  }
}
