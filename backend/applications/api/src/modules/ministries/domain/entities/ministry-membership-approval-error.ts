import type { NotificationError } from '@/shared/domain/notification';

export const MinistryMembershipApprovalErrorCodes = {
  NotRequested: 'ministry_membership.approval.not_requested',
} as const;

export type MinistryMembershipApprovalError = NotificationError<
  typeof MinistryMembershipApprovalErrorCodes.NotRequested
>;
