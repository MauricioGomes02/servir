import { failure, success, type Result } from '@/shared/core/result';
import { isCanonicalUuid } from '@/shared/core/uuid';
import { EntityId } from '@/shared/domain/entity';
import type { NotificationError } from '@/shared/domain/notification';
export const TeamMembershipIdErrorCodes = { Invalid: 'team_membership.id.invalid' } as const;
export type TeamMembershipIdError = NotificationError<typeof TeamMembershipIdErrorCodes.Invalid>;
export class TeamMembershipId extends EntityId<'TeamMembershipId'> {
  private constructor(value: string) {
    super(value);
  }
  static create(value: unknown): Result<TeamMembershipId, TeamMembershipIdError> {
    if (typeof value !== 'string' || !isCanonicalUuid(value.trim()))
      return failure({ code: TeamMembershipIdErrorCodes.Invalid, field: 'teamMembershipId' });
    return success(new TeamMembershipId(value.trim()));
  }
}
