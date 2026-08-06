import type { NotificationError } from '@/shared/domain/notification';

export const MinistryRoleIdErrorCodes = {
  InvalidType: 'ministry_role.id.invalid_type',
  Empty: 'ministry_role.id.empty',
  TooLong: 'ministry_role.id.too_long',
  InvalidFormat: 'ministry_role.id.invalid_format',
} as const;
export type MinistryRoleIdErrorCode = (typeof MinistryRoleIdErrorCodes)[keyof typeof MinistryRoleIdErrorCodes];
export type MinistryRoleIdError = NotificationError<MinistryRoleIdErrorCode>;
