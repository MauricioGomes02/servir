import { success, type Result } from '@/shared/core/result';
import { EntityId, validateEntityId } from '@/shared/domain/entity';
import type { NotificationError } from '@/shared/domain/notification';
export const TeamMembershipIdErrorCodes = {
  InvalidType: 'team_membership.id.invalid_type',
  Empty: 'team_membership.id.empty',
  TooLong: 'team_membership.id.too_long',
  InvalidFormat: 'team_membership.id.invalid_format',
} as const;
export type TeamMembershipIdError = NotificationError<
  (typeof TeamMembershipIdErrorCodes)[keyof typeof TeamMembershipIdErrorCodes]
>;
export class TeamMembershipId extends EntityId<'TeamMembershipId'> {
  private constructor(value: string) {
    super(value);
  }
  static create(value: unknown): Result<TeamMembershipId, TeamMembershipIdError> {
    const validated = validateEntityId(value, 'teamMembershipId', TeamMembershipIdErrorCodes);
    if (!validated.success) return validated;
    return success(new TeamMembershipId(validated.value));
  }
}
