import { success, type Result } from '@/shared/core/result';
import { EntityId, validateEntityId } from '@/shared/domain/entity';
import type { NotificationError } from '@/shared/domain/notification';

export const TeamLeadershipIdErrorCodes = {
  InvalidType: 'team_leadership.id.invalid_type',
  Empty: 'team_leadership.id.empty',
  TooLong: 'team_leadership.id.too_long',
  InvalidFormat: 'team_leadership.id.invalid_format',
} as const;
export type TeamLeadershipIdError = NotificationError<
  (typeof TeamLeadershipIdErrorCodes)[keyof typeof TeamLeadershipIdErrorCodes]
>;

export class TeamLeadershipId extends EntityId<'TeamLeadershipId'> {
  private constructor(value: string) {
    super(value);
  }

  static create(value: unknown): Result<TeamLeadershipId, TeamLeadershipIdError> {
    const validated = validateEntityId(value, 'teamLeadershipId', TeamLeadershipIdErrorCodes);
    if (!validated.success) return validated;
    return success(new TeamLeadershipId(validated.value));
  }
}
