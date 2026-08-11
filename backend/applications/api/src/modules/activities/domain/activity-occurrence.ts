import type { OrganizationId } from '@/modules/organizations/domain';
import { AggregateRoot } from '@/shared/domain/aggregate-root';
import {
  createDomainEvent,
  type DomainEvent,
  type DomainEventId,
} from '@/shared/domain/domain-event';
import { failure, success, type Result } from '@/shared/core/result';
import { EntityId, validateEntityId } from '@/shared/domain/entity';
import type { Instant } from '@/shared/domain/instant';
import type { CivilDate, CivilTime, TimeZoneId } from '@/shared/domain/temporal';
import type { NotificationError } from '@/shared/domain/notification';

import type { ActivityId } from './activity-id';

export class ResolvedUtcOffset {
  private constructor(private readonly value: string) {
    Object.freeze(this);
  }

  static create(value: string): ResolvedUtcOffset {
    if (!/^[+-](?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,9})?)?$/.test(value))
      throw new Error('resolved_utc_offset.invalid');
    return new ResolvedUtcOffset(value);
  }

  toString(): string {
    return this.value;
  }
}

export const ActivityOccurrenceIdErrorCodes = {
  InvalidType: 'activity_occurrence_id.invalid_type',
  Empty: 'activity_occurrence_id.empty',
  TooLong: 'activity_occurrence_id.too_long',
  InvalidFormat: 'activity_occurrence_id.invalid_format',
} as const;
export type ActivityOccurrenceIdError = NotificationError<
  (typeof ActivityOccurrenceIdErrorCodes)[keyof typeof ActivityOccurrenceIdErrorCodes]
>;

export class ActivityOccurrenceId extends EntityId<'ActivityOccurrenceId'> {
  private constructor(value: string) {
    super(value);
    Object.freeze(this);
  }

  static create(input: unknown): Result<ActivityOccurrenceId, ActivityOccurrenceIdError> {
    const result = validateEntityId(input, 'activityOccurrenceId', ActivityOccurrenceIdErrorCodes);
    return result.success ? success(new ActivityOccurrenceId(result.value)) : failure(result.error);
  }
}

export type ActivityOccurrenceScheduled = DomainEvent<
  'activity_occurrence.scheduled',
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
  }>
>;

interface ActivityOccurrenceProps {
  readonly organizationId: OrganizationId;
  readonly activityId: ActivityId;
  readonly civilDate: CivilDate;
  readonly civilTime: CivilTime;
  readonly timeZoneId: TimeZoneId;
  readonly resolvedOffset: ResolvedUtcOffset;
  readonly scheduledAt: Instant;
  readonly origin: 'manual';
  readonly revision: 1;
  readonly status: 'scheduled';
}

export class ActivityOccurrence extends AggregateRoot<
  ActivityOccurrenceId,
  ActivityOccurrenceProps,
  ActivityOccurrenceScheduled
> {
  private constructor(id: ActivityOccurrenceId, props: ActivityOccurrenceProps) {
    super(id, props);
  }

  static scheduleManual(input: {
    readonly id: ActivityOccurrenceId;
    readonly organizationId: OrganizationId;
    readonly activityId: ActivityId;
    readonly civilDate: CivilDate;
    readonly civilTime: CivilTime;
    readonly timeZoneId: TimeZoneId;
    readonly resolvedOffset: ResolvedUtcOffset;
    readonly scheduledAt: Instant;
    readonly eventId: DomainEventId;
    readonly occurredAt: Instant;
  }): ActivityOccurrence {
    const occurrence = new ActivityOccurrence(input.id, {
      organizationId: input.organizationId,
      activityId: input.activityId,
      civilDate: input.civilDate,
      civilTime: input.civilTime,
      timeZoneId: input.timeZoneId,
      resolvedOffset: input.resolvedOffset,
      scheduledAt: input.scheduledAt,
      origin: 'manual',
      revision: 1,
      status: 'scheduled',
    });
    occurrence.recordDomainEvent(
      createDomainEvent({
        eventId: input.eventId,
        name: 'activity_occurrence.scheduled',
        occurredAt: input.occurredAt,
        payload: {
          activityOccurrenceId: input.id.toString(),
          organizationId: input.organizationId.toString(),
          activityId: input.activityId.toString(),
          civilDate: input.civilDate.toISOString(),
          civilTime: input.civilTime.toISOString(),
          timeZoneId: input.timeZoneId.toString(),
          resolvedOffset: input.resolvedOffset.toString(),
          scheduledAt: input.scheduledAt.toISOString(),
          origin: 'manual',
          revision: 1,
        },
      }),
    );
    return occurrence;
  }

  get organizationId(): OrganizationId {
    return this.props.organizationId;
  }
  get activityId(): ActivityId {
    return this.props.activityId;
  }
  get civilDate(): CivilDate {
    return this.props.civilDate;
  }
  get civilTime(): CivilTime {
    return this.props.civilTime;
  }
  get timeZoneId(): TimeZoneId {
    return this.props.timeZoneId;
  }
  get resolvedOffset(): ResolvedUtcOffset {
    return this.props.resolvedOffset;
  }
  get scheduledAt(): Instant {
    return this.props.scheduledAt;
  }
  get origin(): 'manual' {
    return this.props.origin;
  }
  get revision(): 1 {
    return this.props.revision;
  }
  get status(): 'scheduled' {
    return this.props.status;
  }
}
