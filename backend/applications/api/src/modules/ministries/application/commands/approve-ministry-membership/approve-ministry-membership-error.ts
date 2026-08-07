import type { NotificationError } from '@/shared/domain/notification';

export const ApproveMinistryMembershipErrorCodes = {
  MembershipNotFound: 'ministry_membership.approval.membership_not_found',
} as const;
export type ApproveMinistryMembershipNotFoundError = NotificationError<
  typeof ApproveMinistryMembershipErrorCodes.MembershipNotFound
>;
