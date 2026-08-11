import { failure, success, type Result } from '@/shared/core/result';
import { normalizeName } from '@/shared/domain/name';
import type { NotificationError } from '@/shared/domain/notification';
import { ValueObject } from '@/shared/domain/value-object';

export const ActivityNameErrorCodes = {
  InvalidType: 'activity.name.invalid_type',
  Empty: 'activity.name.empty',
  TooLong: 'activity.name.too_long',
} as const;
export type ActivityNameError = NotificationError<
  (typeof ActivityNameErrorCodes)[keyof typeof ActivityNameErrorCodes]
>;

interface ActivityNameProps {
  readonly value: string;
}

export class ActivityName extends ValueObject<ActivityNameProps, 'ActivityName'> {
  private constructor(value: string) {
    super({ value });
    Object.freeze(this);
  }

  static create(input: unknown): Result<ActivityName, ActivityNameError> {
    if (typeof input !== 'string')
      return failure({ code: ActivityNameErrorCodes.InvalidType, field: 'name' });
    const value = normalizeName(input);
    if (value.length === 0) return failure({ code: ActivityNameErrorCodes.Empty, field: 'name' });
    if (value.length > 120)
      return failure({
        code: ActivityNameErrorCodes.TooLong,
        field: 'name',
        params: { maxLength: 120, actualLength: value.length },
      });
    return success(new ActivityName(value));
  }

  toString(): string {
    return this.props.value;
  }

  toJSON(): string {
    return this.props.value;
  }
}
