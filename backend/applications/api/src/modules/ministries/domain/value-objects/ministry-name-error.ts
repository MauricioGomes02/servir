import type { NotificationError } from '@/shared/domain/notification';

export const MinistryNameErrorCodes = {
  InvalidType: 'ministry.name.invalid_type',
  Empty: 'ministry.name.empty',
  TooLong: 'ministry.name.too_long',
} as const;

export type MinistryNameErrorCode =
  (typeof MinistryNameErrorCodes)[keyof typeof MinistryNameErrorCodes];
export type MinistryNameError = NotificationError<MinistryNameErrorCode>;
