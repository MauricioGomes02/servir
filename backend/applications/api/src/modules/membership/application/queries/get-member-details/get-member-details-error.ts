import type { NotificationError } from '@/shared/domain/notification';

export const GetMemberDetailsErrorCodes = {
  NotFound: 'member.details.not_found',
} as const;

export type GetMemberDetailsError = NotificationError<
  (typeof GetMemberDetailsErrorCodes)[keyof typeof GetMemberDetailsErrorCodes]
>;
