import { success, type Result } from '@/shared/core/result';
import { EntityId, validateEntityId } from '@/shared/domain/entity';
import type { NotificationError } from '@/shared/domain/notification';
export const MinistryTeamIdErrorCodes = {
  InvalidType: 'ministry_team.id.invalid_type',
  Empty: 'ministry_team.id.empty',
  TooLong: 'ministry_team.id.too_long',
  InvalidFormat: 'ministry_team.id.invalid_format',
} as const;
export type MinistryTeamIdError = NotificationError<
  (typeof MinistryTeamIdErrorCodes)[keyof typeof MinistryTeamIdErrorCodes]
>;
export class MinistryTeamId extends EntityId<'MinistryTeamId'> {
  private constructor(value: string) {
    super(value);
  }
  static create(value: unknown): Result<MinistryTeamId, MinistryTeamIdError> {
    const validated = validateEntityId(value, 'ministryTeamId', MinistryTeamIdErrorCodes);
    if (!validated.success) return validated;
    return success(new MinistryTeamId(validated.value));
  }
}
