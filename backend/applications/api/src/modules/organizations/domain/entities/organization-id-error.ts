import type { NotificationError } from '@/shared/domain/notification';

export const OrganizationIdErrorCodes = {
  InvalidType: 'organization.id.invalid_type',
  Empty: 'organization.id.empty',
  TooLong: 'organization.id.too_long',
  InvalidFormat: 'organization.id.invalid_format',
} as const;

export type OrganizationIdErrorCode =
  (typeof OrganizationIdErrorCodes)[keyof typeof OrganizationIdErrorCodes];

export type OrganizationIdError = NotificationError<OrganizationIdErrorCode>;
