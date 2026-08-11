import { MinistryId } from '@/modules/ministries/domain';
import { OrganizationId, type OrganizationIdError } from '@/modules/organizations/domain';
import type { Clock } from '@/shared/application/clock';
import type { ExecutionContext } from '@/shared/application/context';
import type { IdGenerator } from '@/shared/application/id-generator';
import { createEventEnvelope, type MessageId } from '@/shared/application/messaging';
import { defineMessage } from '@/shared/application/mediator';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import { combineValidationResults, type ValidationErrors } from '@/shared/application/validation';
import { failure, success, type Result } from '@/shared/core/result';
import type { DomainEventId } from '@/shared/domain/domain-event';
import { Notification, type NotificationError } from '@/shared/domain/notification';
import type { IntegrationEvent } from '@servir/integration-messaging';

import {
  Activity,
  ActivityName,
  type ActivityCreationError,
  type ActivityCreationPolicy,
  type ActivityId,
  type ActivityNameError,
} from '../domain';
import type { ActivityCreationFactsReader, ActivityWriteScope } from './ports';

export interface CreateActivityCommand {
  readonly organizationId: unknown;
  readonly name: unknown;
  readonly ministryIds: unknown;
}

export interface CreateActivityOutput {
  readonly activityId: ActivityId;
  readonly organizationId: OrganizationId;
  readonly name: string;
  readonly ministryIds: readonly string[];
  readonly status: 'active';
}

export interface CreateActivityDependencies {
  readonly clock: Clock;
  readonly activityIdGenerator: IdGenerator<ActivityId>;
  readonly domainEventIdGenerator: IdGenerator<DomainEventId>;
  readonly messageIdGenerator: IdGenerator<MessageId>;
  readonly facts: ActivityCreationFactsReader;
  readonly policy: ActivityCreationPolicy;
  readonly unitOfWork: UnitOfWork<ActivityWriteScope>;
}

type CreateActivityError =
  OrganizationIdError | ActivityNameError | ActivityCreationError | ValidationErrors;

function parseMinistryIds(input: unknown): Result<readonly MinistryId[], NotificationError> {
  if (!Array.isArray(input))
    return failure({ code: 'activity.creation.ministry_ids_invalid_type', field: 'ministryIds' });
  const notification = new Notification();
  const values: MinistryId[] = [];
  input.forEach((candidate, index) => {
    const parsed = MinistryId.create(candidate);
    if (parsed.success) values.push(parsed.value);
    else notification.add({ ...parsed.error, field: `ministryIds[${index}]` });
  });
  if (notification.hasErrors()) {
    const errors = notification.getErrors() as ValidationErrors['errors'];
    const primary = errors[0];
    if (!primary) throw new Error('activity.validation.empty_errors');
    const validation: ValidationErrors = Object.freeze({ ...primary, errors });
    return failure(validation);
  }
  return success(Object.freeze(values));
}

export class CreateActivityHandler {
  constructor(private readonly dependencies: CreateActivityDependencies) {}

  async handle(
    command: CreateActivityCommand,
    context: ExecutionContext,
  ): Promise<Result<CreateActivityOutput, CreateActivityError>> {
    const validated = combineValidationResults(
      OrganizationId.create(command.organizationId),
      ActivityName.create(command.name),
      parseMinistryIds(command.ministryIds),
    );
    if (!validated.success) return validated;
    const [organizationId, name, ministryIds] = validated.value;
    const participants = this.dependencies.policy.validateParticipants(ministryIds);
    if (!participants.success) return participants;
    const facts = await this.dependencies.facts.find(organizationId, name, ministryIds);
    const allowed = this.dependencies.policy.evaluate(facts, ministryIds);
    if (!allowed.success) return allowed;

    const created = Activity.create({
      id: this.dependencies.activityIdGenerator.generate(),
      organizationId,
      name,
      ministryIds,
      eventId: this.dependencies.domainEventIdGenerator.generate(),
      occurredAt: this.dependencies.clock.now(),
    });
    if (!created.success) return created;
    const activity = created.value;
    const pendingEvents = activity.pendingDomainEvents;
    const envelopes = pendingEvents.map((event) =>
      createEventEnvelope({
        messageId: this.dependencies.messageIdGenerator.generate(),
        correlationId: context.correlationId,
        event,
      }),
    );
    const persisted = await this.dependencies.unitOfWork.execute(async (scope) => {
      const added = await scope.activities.add(activity);
      if (!added.success) return added;
      await scope.outbox.add(envelopes);
      return success();
    });
    if (!persisted.success) return persisted;
    activity.acknowledgeDomainEvents(pendingEvents);
    return success(
      Object.freeze({
        activityId: activity.id,
        organizationId: activity.organizationId,
        name: activity.name.toString(),
        ministryIds: Object.freeze(activity.ministryIds.map((id) => id.toString())),
        status: 'active' as const,
      }),
    );
  }
}

export const CreateActivityMessage = defineMessage<
  CreateActivityCommand,
  Awaited<ReturnType<CreateActivityHandler['handle']>>
>('activities.create-activity', 'CreateActivity');

export type ActivityCreatedIntegrationEventV1 = IntegrationEvent<
  'activity.created',
  1,
  Readonly<{
    activityId: string;
    organizationId: string;
    name: string;
    ministryIds: readonly string[];
    status: 'active';
  }>
>;
