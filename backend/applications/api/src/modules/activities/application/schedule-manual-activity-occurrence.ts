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
import type { NotificationError } from '@/shared/domain/notification';
import {
  CivilDate,
  CivilTime,
  TimeZoneId,
  type CivilDateError,
  type CivilTimeError,
  type TimeZoneIdError,
} from '@/shared/domain/temporal';
import type { IntegrationEvent } from '@servir/integration-messaging';
import {
  ActivityId,
  ActivityOccurrence,
  type ActivityIdError,
  type ActivityOccurrenceId,
  type ActivityOccurrenceSchedulingError,
  type ActivityOccurrenceSchedulingPolicy,
} from '../domain';
import type {
  ActivityOccurrenceSchedulingFactsReader,
  ActivityOccurrenceWriteScope,
  CivilScheduleResolver,
  ScheduleDisambiguation,
} from './occurrence-ports';

export const CivilScheduleResolutionErrorCodes = {
  InvalidDisambiguation: 'activity_occurrence.schedule.invalid_disambiguation',
  NonexistentLocalTime: 'activity_occurrence.schedule.nonexistent_local_time',
  AmbiguousLocalTime: 'activity_occurrence.schedule.ambiguous_local_time',
} as const;
export type CivilScheduleResolutionError = NotificationError<
  (typeof CivilScheduleResolutionErrorCodes)[keyof typeof CivilScheduleResolutionErrorCodes]
>;

function parseDisambiguation(
  input: unknown,
): Result<ScheduleDisambiguation | undefined, CivilScheduleResolutionError> {
  if (input === undefined) return success(undefined);
  return input === 'earlier' || input === 'later'
    ? success(input)
    : failure({
        code: CivilScheduleResolutionErrorCodes.InvalidDisambiguation,
        field: 'disambiguation',
      });
}

export interface ScheduleManualActivityOccurrenceCommand {
  readonly organizationId: unknown;
  readonly activityId: unknown;
  readonly date: unknown;
  readonly time: unknown;
  readonly timeZoneId: unknown;
  readonly disambiguation?: unknown;
}
export interface ScheduleManualActivityOccurrenceOutput {
  readonly activityOccurrenceId: ActivityOccurrenceId;
  readonly organizationId: OrganizationId;
  readonly activityId: ActivityId;
  readonly civilDate: string;
  readonly civilTime: string;
  readonly timeZoneId: string;
  readonly resolvedOffset: string;
  readonly scheduledAt: string;
  readonly origin: 'manual';
  readonly revision: 1;
  readonly status: 'scheduled';
}
export interface ScheduleManualActivityOccurrenceDependencies {
  readonly clock: Clock;
  readonly occurrenceIdGenerator: IdGenerator<ActivityOccurrenceId>;
  readonly domainEventIdGenerator: IdGenerator<DomainEventId>;
  readonly messageIdGenerator: IdGenerator<MessageId>;
  readonly resolver: CivilScheduleResolver;
  readonly facts: ActivityOccurrenceSchedulingFactsReader;
  readonly policy: ActivityOccurrenceSchedulingPolicy;
  readonly unitOfWork: UnitOfWork<ActivityOccurrenceWriteScope>;
}
type ScheduleManualActivityOccurrenceError =
  | OrganizationIdError
  | ActivityIdError
  | CivilDateError
  | CivilTimeError
  | TimeZoneIdError
  | CivilScheduleResolutionError
  | ActivityOccurrenceSchedulingError
  | ValidationErrors;

export class ScheduleManualActivityOccurrenceHandler {
  constructor(private readonly dependencies: ScheduleManualActivityOccurrenceDependencies) {}
  async handle(
    command: ScheduleManualActivityOccurrenceCommand,
    context: ExecutionContext,
  ): Promise<
    Result<ScheduleManualActivityOccurrenceOutput, ScheduleManualActivityOccurrenceError>
  > {
    const validated = combineValidationResults(
      OrganizationId.create(command.organizationId),
      ActivityId.create(command.activityId),
      CivilDate.create(command.date),
      CivilTime.create(command.time),
      TimeZoneId.create(command.timeZoneId),
      parseDisambiguation(command.disambiguation),
    );
    if (!validated.success) return validated;
    const [organizationId, activityId, civilDate, civilTime, timeZoneId, disambiguation] =
      validated.value;
    const resolved = this.dependencies.resolver.resolve({
      civilDate,
      civilTime,
      timeZoneId,
      disambiguation,
    });
    if (!resolved.success) return resolved;
    const facts = await this.dependencies.facts.find(
      organizationId,
      activityId,
      resolved.value.scheduledAt,
    );
    const allowed = this.dependencies.policy.evaluate(facts);
    if (!allowed.success) return allowed;
    const occurrence = ActivityOccurrence.scheduleManual({
      id: this.dependencies.occurrenceIdGenerator.generate(),
      organizationId,
      activityId,
      civilDate,
      civilTime,
      timeZoneId,
      resolvedOffset: resolved.value.resolvedOffset,
      scheduledAt: resolved.value.scheduledAt,
      eventId: this.dependencies.domainEventIdGenerator.generate(),
      occurredAt: this.dependencies.clock.now(),
    });
    const pendingEvents = occurrence.pendingDomainEvents;
    const envelopes = pendingEvents.map((event) =>
      createEventEnvelope({
        messageId: this.dependencies.messageIdGenerator.generate(),
        correlationId: context.correlationId,
        event,
      }),
    );
    const persisted = await this.dependencies.unitOfWork.execute(async (scope) => {
      const added = await scope.activityOccurrences.add(occurrence);
      if (!added.success) return added;
      await scope.outbox.add(envelopes);
      return success();
    });
    if (!persisted.success) return persisted;
    occurrence.acknowledgeDomainEvents(pendingEvents);
    return success(
      Object.freeze({
        activityOccurrenceId: occurrence.id,
        organizationId: occurrence.organizationId,
        activityId: occurrence.activityId,
        civilDate: occurrence.civilDate.toISOString(),
        civilTime: occurrence.civilTime.toISOString(),
        timeZoneId: occurrence.timeZoneId.toString(),
        resolvedOffset: occurrence.resolvedOffset.toString(),
        scheduledAt: occurrence.scheduledAt.toISOString(),
        origin: occurrence.origin,
        revision: occurrence.revision,
        status: occurrence.status,
      }),
    );
  }
}
export const ScheduleManualActivityOccurrenceMessage = defineMessage<
  ScheduleManualActivityOccurrenceCommand,
  Awaited<ReturnType<ScheduleManualActivityOccurrenceHandler['handle']>>
>('activities.schedule-manual-occurrence', 'ScheduleManualActivityOccurrence');
export type ActivityOccurrenceScheduledIntegrationEventV1 = IntegrationEvent<
  'activity_occurrence.scheduled',
  1,
  Readonly<{
    activityOccurrenceId: string;
    organizationId: string;
    activityId: string;
    civilDate: string;
    civilTime: string;
    timeZoneId: string;
    resolvedOffset: string;
    scheduledAt: string;
    origin: 'manual';
    revision: 1;
    status: 'scheduled';
  }>
>;
