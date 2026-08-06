import type { NotificationError } from '@/shared/domain/notification';
export const MinistryRoleNameErrorCodes = {
  InvalidType: 'ministry_role.name.invalid_type',
  Empty: 'ministry_role.name.empty',
  TooLong: 'ministry_role.name.too_long',
} as const;
export type MinistryRoleNameErrorCode = (typeof MinistryRoleNameErrorCodes)[keyof typeof MinistryRoleNameErrorCodes];
export type MinistryRoleNameError = NotificationError<MinistryRoleNameErrorCode>;
