import { failure, success, type Result } from '@/shared/core/result';
import {
  MinistryRoleQualificationErrorCodes,
  type MinistryRoleQualificationError,
} from '../entities';
export class MinistryRoleQualificationPolicy {
  evaluate(facts: {
    membershipIsActive: boolean;
    roleIsActive: boolean;
    activeQualificationExists: boolean;
  }): Result<void, MinistryRoleQualificationError> {
    if (!facts.membershipIsActive)
      return failure({
        code: MinistryRoleQualificationErrorCodes.MembershipNotActive,
        field: 'ministryMembershipId',
      });
    if (!facts.roleIsActive)
      return failure({
        code: MinistryRoleQualificationErrorCodes.RoleNotActive,
        field: 'ministryRoleId',
      });
    if (facts.activeQualificationExists)
      return failure({
        code: MinistryRoleQualificationErrorCodes.ActiveQualificationAlreadyExists,
        field: 'ministryRoleId',
      });
    return success();
  }
}
