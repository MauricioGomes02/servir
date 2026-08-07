import type { OrganizationId } from '@/modules/organizations/domain';
import { failure, success, type Result } from '@/shared/core/result';
import type { NotificationError } from '@/shared/domain/notification';

export interface OrganizationRegistrationFacts {
  readonly organizationId: OrganizationId;
}

export interface MemberRegistrationPolicyInput {
  readonly organization: OrganizationRegistrationFacts | undefined;
}

export const MemberRegistrationPolicyErrorCodes = {
  OrganizationNotFound: 'member.registration.organization_not_found',
} as const;

export type MemberRegistrationPolicyErrorCode =
  (typeof MemberRegistrationPolicyErrorCodes)[keyof typeof MemberRegistrationPolicyErrorCodes];

export type MemberRegistrationPolicyError = NotificationError<MemberRegistrationPolicyErrorCode>;

export class MemberRegistrationPolicy {
  evaluate(input: MemberRegistrationPolicyInput): Result<void, MemberRegistrationPolicyError> {
    if (!input.organization) {
      return failure({
        code: MemberRegistrationPolicyErrorCodes.OrganizationNotFound,
        field: 'organizationId',
      });
    }

    return success();
  }
}
