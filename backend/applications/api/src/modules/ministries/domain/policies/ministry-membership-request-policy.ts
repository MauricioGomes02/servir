import { failure, success, type Result } from '@/shared/core/result';

export const MinistryMembershipRequestPolicyErrorCodes = {
  MemberNotFound: 'ministry_membership.request.member_not_found',
  MinistryNotFound: 'ministry_membership.request.ministry_not_found',
  CurrentMembershipAlreadyExists: 'ministry_membership.request.current_membership_already_exists',
} as const;
export type MinistryMembershipRequestPolicyErrorCode =
  (typeof MinistryMembershipRequestPolicyErrorCodes)[keyof typeof MinistryMembershipRequestPolicyErrorCodes];
export interface MinistryMembershipRequestPolicyError {
  readonly code: MinistryMembershipRequestPolicyErrorCode;
  readonly field: 'memberId' | 'ministryId';
}
export interface MinistryMembershipRequestFacts {
  readonly memberIsActive: boolean;
  readonly ministryIsActive: boolean;
  readonly currentMembershipExists: boolean;
}

export class MinistryMembershipRequestPolicy {
  evaluate(
    facts: MinistryMembershipRequestFacts,
  ): Result<void, MinistryMembershipRequestPolicyError> {
    if (!facts.memberIsActive)
      return failure({
        code: MinistryMembershipRequestPolicyErrorCodes.MemberNotFound,
        field: 'memberId',
      });
    if (!facts.ministryIsActive)
      return failure({
        code: MinistryMembershipRequestPolicyErrorCodes.MinistryNotFound,
        field: 'ministryId',
      });
    if (facts.currentMembershipExists)
      return failure({
        code: MinistryMembershipRequestPolicyErrorCodes.CurrentMembershipAlreadyExists,
        field: 'memberId',
      });
    return success();
  }
}
