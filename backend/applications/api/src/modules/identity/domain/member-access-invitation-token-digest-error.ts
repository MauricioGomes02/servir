import type { NotificationError } from '@/shared/domain/notification';

export const MemberAccessInvitationTokenDigestErrorCodes = {
  InvalidFormat: 'identity.member_access_invitation.token_digest.invalid_format',
  InvalidType: 'identity.member_access_invitation.token_digest.invalid_type',
} as const;

export type MemberAccessInvitationTokenDigestErrorCode =
  (typeof MemberAccessInvitationTokenDigestErrorCodes)[keyof typeof MemberAccessInvitationTokenDigestErrorCodes];

export type MemberAccessInvitationTokenDigestError =
  NotificationError<MemberAccessInvitationTokenDigestErrorCode>;
