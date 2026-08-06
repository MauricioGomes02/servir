import type { NotificationError } from '@/shared/domain/notification';

export const MinistryIdErrorCodes = {
  InvalidType: 'ministry.id.invalid_type',
  Empty: 'ministry.id.empty',
  TooLong: 'ministry.id.too_long',
  InvalidFormat: 'ministry.id.invalid_format',
} as const;

export type MinistryIdErrorCode =
  (typeof MinistryIdErrorCodes)[keyof typeof MinistryIdErrorCodes];

export type MinistryIdError = NotificationError<MinistryIdErrorCode>;
