import type { Result } from '@/shared/core/result';
import type { MinistryTeam, MinistryTeamCreationPolicyError } from '../../../domain';
export interface MinistryTeamRepository {
  add(team: MinistryTeam): Promise<Result<void, MinistryTeamCreationPolicyError>>;
}
