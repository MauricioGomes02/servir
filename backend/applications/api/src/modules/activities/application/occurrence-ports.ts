import type { OrganizationId } from '@/modules/organizations/domain';
import type { EventOutbox } from '@/shared/application/messaging';
import type { Result } from '@/shared/core/result';
import type { Instant } from '@/shared/domain/instant';
import type { CivilDate, CivilTime, TimeZoneId } from '@/shared/domain/temporal';
import type {
  ActivityId,
  ActivityOccurrence,
  ResolvedUtcOffset,
  ActivityOccurrenceSchedulingError,
  ActivityOccurrenceSchedulingFacts,
} from '../domain';
import type { CivilScheduleResolutionError } from './schedule-manual-activity-occurrence';

export type ScheduleDisambiguation = 'earlier' | 'later';
export interface ResolvedCivilSchedule {
  readonly scheduledAt: Instant;
  readonly resolvedOffset: ResolvedUtcOffset;
}
export interface CivilScheduleResolver {
  resolve(input: {
    readonly civilDate: CivilDate;
    readonly civilTime: CivilTime;
    readonly timeZoneId: TimeZoneId;
    readonly disambiguation?: ScheduleDisambiguation;
  }): Result<ResolvedCivilSchedule, CivilScheduleResolutionError>;
}
export interface ActivityOccurrenceSchedulingFactsReader {
  find(
    organizationId: OrganizationId,
    activityId: ActivityId,
    scheduledAt: Instant,
  ): Promise<ActivityOccurrenceSchedulingFacts>;
}
export interface ActivityOccurrenceRepository {
  add(occurrence: ActivityOccurrence): Promise<Result<void, ActivityOccurrenceSchedulingError>>;
}
export interface ActivityOccurrenceWriteScope {
  readonly activityOccurrences: ActivityOccurrenceRepository;
  readonly outbox: EventOutbox;
}
