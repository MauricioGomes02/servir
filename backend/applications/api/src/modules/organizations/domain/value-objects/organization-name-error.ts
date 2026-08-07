import type { NotificationError } from '@/shared/domain/notification';

export const OrganizationNameErrorCodes = {
  InvalidType: 'organization.name.invalid_type',
  Empty: 'organization.name.empty',
  TooLong: 'organization.name.too_long',
} as const;

export type OrganizationNameErrorCode =
  (typeof OrganizationNameErrorCodes)[keyof typeof OrganizationNameErrorCodes];

export type OrganizationNameError = NotificationError<OrganizationNameErrorCode>;
