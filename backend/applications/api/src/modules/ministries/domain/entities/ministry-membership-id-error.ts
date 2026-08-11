export const MinistryMembershipIdErrorCodes = {
  InvalidType: 'ministry_membership.id.invalid_type',
  Empty: 'ministry_membership.id.empty',
  InvalidFormat: 'ministry_membership.id.invalid_format',
  TooLong: 'ministry_membership.id.too_long',
} as const;

export type MinistryMembershipIdErrorCode =
  (typeof MinistryMembershipIdErrorCodes)[keyof typeof MinistryMembershipIdErrorCodes];

import type { NotificationError } from '@/shared/domain/notification';

export type MinistryMembershipIdError = NotificationError<MinistryMembershipIdErrorCode>;
