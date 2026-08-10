import { failure, success, type Result } from '@/shared/core/result';
import { ValueObject } from '@/shared/domain/value-object';
import type { NotificationError } from '@/shared/domain/notification';
export const MinistryTeamNameErrorCodes = {
  InvalidType: 'ministry_team.name.invalid_type',
  Empty: 'ministry_team.name.empty',
  TooLong: 'ministry_team.name.too_long',
} as const;
export type MinistryTeamNameError = NotificationError<
  (typeof MinistryTeamNameErrorCodes)[keyof typeof MinistryTeamNameErrorCodes]
>;
export class MinistryTeamName extends ValueObject<{ readonly value: string }, 'MinistryTeamName'> {
  private constructor(value: string) {
    super({ value });
  }
  static create(value: unknown): Result<MinistryTeamName, MinistryTeamNameError> {
    if (typeof value !== 'string')
      return failure({ code: MinistryTeamNameErrorCodes.InvalidType, field: 'name' });
    const normalized = value.trim().replace(/\s+/g, ' ');
    if (!normalized) return failure({ code: MinistryTeamNameErrorCodes.Empty, field: 'name' });
    if (normalized.length > 120)
      return failure({
        code: MinistryTeamNameErrorCodes.TooLong,
        field: 'name',
        params: { maxLength: 120 },
      });
    return success(new MinistryTeamName(normalized));
  }
  toString() {
    return this.props.value;
  }
}
