import type { NotificationError } from '@/shared/domain/notification';
export const QualifyMemberForMinistryRoleErrorCodes = {
  MembershipNotFound: 'ministry_role_qualification.membership_not_found',
} as const;
export type QualifyMemberForMinistryRoleNotFoundError = NotificationError<
  typeof QualifyMemberForMinistryRoleErrorCodes.MembershipNotFound
>;
