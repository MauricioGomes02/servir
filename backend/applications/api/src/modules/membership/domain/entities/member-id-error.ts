import type { NotificationError } from '@/shared/domain/notification';

export const MemberIdErrorCodes = {
  InvalidType: 'member.id.invalid_type',
  Empty: 'member.id.empty',
  TooLong: 'member.id.too_long',
  InvalidFormat: 'member.id.invalid_format',
} as const;

export type MemberIdErrorCode =
  (typeof MemberIdErrorCodes)[keyof typeof MemberIdErrorCodes];

export type MemberIdError = NotificationError<MemberIdErrorCode>;
