import { failure, success, type Result } from '@/shared/core/result';
import { isCanonicalUuid } from '@/shared/core/uuid';
import { EntityId } from '@/shared/domain/entity';
import type { NotificationError } from '@/shared/domain/notification';

export const TeamLeadershipIdErrorCodes = { Invalid: 'team_leadership.id.invalid' } as const;
export type TeamLeadershipIdError = NotificationError<typeof TeamLeadershipIdErrorCodes.Invalid>;

export class TeamLeadershipId extends EntityId<'TeamLeadershipId'> {
  private constructor(value: string) {
    super(value);
  }

  static create(value: unknown): Result<TeamLeadershipId, TeamLeadershipIdError> {
    if (typeof value !== 'string' || !isCanonicalUuid(value.trim()))
      return failure({ code: TeamLeadershipIdErrorCodes.Invalid, field: 'teamLeadershipId' });
    return success(new TeamLeadershipId(value.trim()));
  }
}
