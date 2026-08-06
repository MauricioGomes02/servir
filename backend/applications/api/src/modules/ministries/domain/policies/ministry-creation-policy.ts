import { failure, success, type Result } from '@/shared/core/result';
import type { NotificationError } from '@/shared/domain/notification';

export interface MinistryCreationFacts {
  readonly organizationExists: boolean;
  readonly activeNameExists: boolean;
}

export const MinistryCreationPolicyErrorCodes = {
  OrganizationNotFound: 'ministry.creation.organization_not_found',
  ActiveNameAlreadyExists: 'ministry.creation.active_name_already_exists',
} as const;

export type MinistryCreationPolicyErrorCode =
  (typeof MinistryCreationPolicyErrorCodes)[keyof typeof MinistryCreationPolicyErrorCodes];
export type MinistryCreationPolicyError = NotificationError<MinistryCreationPolicyErrorCode>;
export type MinistryActiveNameConflictError = NotificationError<
  typeof MinistryCreationPolicyErrorCodes.ActiveNameAlreadyExists
>;

export class MinistryCreationPolicy {
  evaluate(facts: MinistryCreationFacts): Result<void, MinistryCreationPolicyError> {
    if (!facts.organizationExists) {
      return failure({
        code: MinistryCreationPolicyErrorCodes.OrganizationNotFound,
        field: 'organizationId',
      });
    }
    if (facts.activeNameExists) {
      return failure(this.activeNameConflict());
    }
    return success();
  }

  activeNameConflict(): MinistryActiveNameConflictError {
    return {
      code: MinistryCreationPolicyErrorCodes.ActiveNameAlreadyExists,
      field: 'name',
    };
  }
}
