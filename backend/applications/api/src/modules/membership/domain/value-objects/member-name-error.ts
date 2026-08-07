import type { NotificationError } from '@/shared/domain/notification';

export const MemberNameErrorCodes = {
  InvalidType: 'member.name.invalid_type',
  Empty: 'member.name.empty',
  TooLong: 'member.name.too_long',
} as const;

export type MemberNameErrorCode = (typeof MemberNameErrorCodes)[keyof typeof MemberNameErrorCodes];

export type MemberNameError = NotificationError<MemberNameErrorCode>;
