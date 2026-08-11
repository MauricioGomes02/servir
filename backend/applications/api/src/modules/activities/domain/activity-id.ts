import { failure, success, type Result } from '@/shared/core/result';
import { EntityId, validateEntityId } from '@/shared/domain/entity';
import type { NotificationError } from '@/shared/domain/notification';

export const ActivityIdErrorCodes = {
  InvalidType: 'activity_id.invalid_type',
  Empty: 'activity_id.empty',
  TooLong: 'activity_id.too_long',
  InvalidFormat: 'activity_id.invalid_format',
} as const;
export type ActivityIdError = NotificationError<
  (typeof ActivityIdErrorCodes)[keyof typeof ActivityIdErrorCodes]
>;

export class ActivityId extends EntityId<'ActivityId'> {
  private constructor(value: string) {
    super(value);
    Object.freeze(this);
  }

  static create(input: unknown): Result<ActivityId, ActivityIdError> {
    const result = validateEntityId(input, 'activityId', ActivityIdErrorCodes);
    return result.success ? success(new ActivityId(result.value)) : failure(result.error);
  }
}
