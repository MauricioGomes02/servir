import type { Result } from '@/shared/core/result';
import type { TeamMembership, TeamMembershipAssignmentPolicyError } from '../../../domain';
export interface TeamMembershipRepository {
  add(membership: TeamMembership): Promise<Result<void, TeamMembershipAssignmentPolicyError>>;
}
