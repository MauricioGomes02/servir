import type { NotificationError } from '@/shared/domain/notification';

export const MemberAccessInvitationIdErrorCodes = {
  Empty: 'identity.member_access_invitation_id.empty',
  InvalidFormat: 'identity.member_access_invitation_id.invalid_format',
  InvalidType: 'identity.member_access_invitation_id.invalid_type',
  TooLong: 'identity.member_access_invitation_id.too_long',
} as const;

export type MemberAccessInvitationIdErrorCode =
  (typeof MemberAccessInvitationIdErrorCodes)[keyof typeof MemberAccessInvitationIdErrorCodes];

export type MemberAccessInvitationIdError = NotificationError<MemberAccessInvitationIdErrorCode>;
