import { failure, success, type Result } from '@/shared/core/result';
import type { NotificationError } from '@/shared/domain/notification';

export interface ActivityOccurrenceSchedulingFacts {
  readonly activityActive: boolean;
  readonly scheduledAtExists: boolean;
}

export const ActivityOccurrenceSchedulingErrorCodes = {
  ActivityNotActive: 'activity_occurrence.scheduling.activity_not_active',
  ScheduledAtAlreadyExists: 'activity_occurrence.scheduling.scheduled_at_already_exists',
} as const;
export type ActivityOccurrenceSchedulingError = NotificationError<
  (typeof ActivityOccurrenceSchedulingErrorCodes)[keyof typeof ActivityOccurrenceSchedulingErrorCodes]
>;

export class ActivityOccurrenceSchedulingPolicy {
  evaluate(
    facts: ActivityOccurrenceSchedulingFacts,
  ): Result<void, ActivityOccurrenceSchedulingError> {
    if (!facts.activityActive)
      return failure({
        code: ActivityOccurrenceSchedulingErrorCodes.ActivityNotActive,
        field: 'activityId',
      });
    if (facts.scheduledAtExists)
      return failure({
        code: ActivityOccurrenceSchedulingErrorCodes.ScheduledAtAlreadyExists,
        field: 'scheduledAt',
      });
    return success();
  }

  scheduledAtConflict(): ActivityOccurrenceSchedulingError {
    return {
      code: ActivityOccurrenceSchedulingErrorCodes.ScheduledAtAlreadyExists,
      field: 'scheduledAt',
    };
  }
}
