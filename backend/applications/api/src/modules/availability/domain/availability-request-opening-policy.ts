import { failure, success, type Result } from '@/shared/core/result';
import type { Instant } from '@/shared/domain/instant';
import type { NotificationError } from '@/shared/domain/notification';

export interface AvailabilityRequestOpeningFacts {
  readonly teamActive: boolean;
}
export const AvailabilityRequestOpeningErrorCodes = {
  TeamNotActive: 'availability_request.opening.team_not_active',
  ResponseDeadlineNotFuture: 'availability_request.opening.response_deadline_not_future',
} as const;
export type AvailabilityRequestOpeningError = NotificationError<
  (typeof AvailabilityRequestOpeningErrorCodes)[keyof typeof AvailabilityRequestOpeningErrorCodes]
>;

export class AvailabilityRequestOpeningPolicy {
  evaluate(
    facts: AvailabilityRequestOpeningFacts,
    respondBy: Instant,
    now: Instant,
  ): Result<void, AvailabilityRequestOpeningError> {
    if (!facts.teamActive)
      return failure({
        code: AvailabilityRequestOpeningErrorCodes.TeamNotActive,
        field: 'ministryTeamId',
      });
    if (respondBy.toEpochMilliseconds() <= now.toEpochMilliseconds())
      return failure({
        code: AvailabilityRequestOpeningErrorCodes.ResponseDeadlineNotFuture,
        field: 'respondBy',
      });
    return success();
  }
}
