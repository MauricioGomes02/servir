import { failure, success, type Result } from '@/shared/core/result';
import type { NotificationError } from '@/shared/domain/notification';
export interface MinistryTeamCreationFacts {
  readonly ministryIsActive: boolean;
  readonly activeNameExists: boolean;
}
export const MinistryTeamCreationPolicyErrorCodes = {
  MinistryNotFound: 'ministry_team.creation.ministry_not_found',
  ActiveNameAlreadyExists: 'ministry_team.creation.active_name_already_exists',
} as const;
export type MinistryTeamCreationPolicyError = NotificationError<
  (typeof MinistryTeamCreationPolicyErrorCodes)[keyof typeof MinistryTeamCreationPolicyErrorCodes]
>;
export class MinistryTeamCreationPolicy {
  evaluate(facts: MinistryTeamCreationFacts): Result<void, MinistryTeamCreationPolicyError> {
    if (!facts.ministryIsActive)
      return failure({
        code: MinistryTeamCreationPolicyErrorCodes.MinistryNotFound,
        field: 'ministryId',
      });
    if (facts.activeNameExists)
      return failure({
        code: MinistryTeamCreationPolicyErrorCodes.ActiveNameAlreadyExists,
        field: 'name',
      });
    return success();
  }
}
