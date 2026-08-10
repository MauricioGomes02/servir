import { failure, success, type Result } from '@/shared/core/result';
import type { NotificationError } from '@/shared/domain/notification';
export interface TeamMembershipAssignmentFacts {
  readonly teamIsActive: boolean;
  readonly ministryMembershipIsActive: boolean;
  readonly activeTeamMembershipExists: boolean;
}
export const TeamMembershipAssignmentPolicyErrorCodes = {
  TeamNotFound: 'team_membership.assignment.team_not_found',
  MinistryMembershipNotActive: 'team_membership.assignment.ministry_membership_not_active',
  ActiveMembershipAlreadyExists: 'team_membership.assignment.active_membership_already_exists',
} as const;
export type TeamMembershipAssignmentPolicyError = NotificationError<
  (typeof TeamMembershipAssignmentPolicyErrorCodes)[keyof typeof TeamMembershipAssignmentPolicyErrorCodes]
>;
export class TeamMembershipAssignmentPolicy {
  evaluate(
    facts: TeamMembershipAssignmentFacts,
  ): Result<void, TeamMembershipAssignmentPolicyError> {
    if (!facts.teamIsActive)
      return failure({
        code: TeamMembershipAssignmentPolicyErrorCodes.TeamNotFound,
        field: 'ministryTeamId',
      });
    if (!facts.ministryMembershipIsActive)
      return failure({
        code: TeamMembershipAssignmentPolicyErrorCodes.MinistryMembershipNotActive,
        field: 'ministryMembershipId',
      });
    if (facts.activeTeamMembershipExists)
      return failure({
        code: TeamMembershipAssignmentPolicyErrorCodes.ActiveMembershipAlreadyExists,
        field: 'ministryMembershipId',
      });
    return success();
  }
}
