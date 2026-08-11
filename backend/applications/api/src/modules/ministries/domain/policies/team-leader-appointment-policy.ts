import { failure, success, type Result } from '@/shared/core/result';
import type { NotificationError } from '@/shared/domain/notification';

export interface TeamLeaderAppointmentFacts {
  readonly teamIsActive: boolean;
  readonly teamMembershipIsActive: boolean;
  readonly activeLeadershipExists: boolean;
}
export const TeamLeaderAppointmentPolicyErrorCodes = {
  TeamNotActive: 'team_leadership.appointment.team_not_active',
  TeamMembershipNotActive: 'team_leadership.appointment.team_membership_not_active',
  ActiveLeadershipAlreadyExists: 'team_leadership.appointment.active_leadership_already_exists',
} as const;
export type TeamLeaderAppointmentPolicyError = NotificationError<
  (typeof TeamLeaderAppointmentPolicyErrorCodes)[keyof typeof TeamLeaderAppointmentPolicyErrorCodes]
>;

export class TeamLeaderAppointmentPolicy {
  evaluate(facts: TeamLeaderAppointmentFacts): Result<void, TeamLeaderAppointmentPolicyError> {
    if (!facts.teamIsActive)
      return failure({
        code: TeamLeaderAppointmentPolicyErrorCodes.TeamNotActive,
        field: 'ministryTeamId',
      });
    if (!facts.teamMembershipIsActive)
      return failure({
        code: TeamLeaderAppointmentPolicyErrorCodes.TeamMembershipNotActive,
        field: 'teamMembershipId',
      });
    if (facts.activeLeadershipExists)
      return failure({
        code: TeamLeaderAppointmentPolicyErrorCodes.ActiveLeadershipAlreadyExists,
        field: 'ministryTeamId',
      });
    return success();
  }
}
