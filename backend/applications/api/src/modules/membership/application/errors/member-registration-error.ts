import type { NotificationError } from '@/shared/domain/notification';

export const MemberRegistrationErrorCodes = {
  OrganizationNotEligible:
    'member.registration.organization_not_eligible',
} as const;

export type MemberRegistrationErrorCode =
  (typeof MemberRegistrationErrorCodes)[keyof typeof MemberRegistrationErrorCodes];

export type MemberRegistrationError = NotificationError<
  MemberRegistrationErrorCode
>;
