import type { Result } from '@/shared/core/result';
import type { TeamLeadership, TeamLeaderAppointmentPolicyError } from '../../../domain';

export interface TeamLeadershipRepository {
  add(leadership: TeamLeadership): Promise<Result<void, TeamLeaderAppointmentPolicyError>>;
}
