import type { NotificationError } from '@/shared/domain/notification';
export const MinistryRoleQualificationErrorCodes = {
  MembershipNotActive: 'ministry_role_qualification.membership_not_active',
  RoleNotActive: 'ministry_role_qualification.role_not_active',
  ActiveQualificationAlreadyExists:
    'ministry_role_qualification.active_qualification_already_exists',
} as const;
export type MinistryRoleQualificationError = NotificationError<
  (typeof MinistryRoleQualificationErrorCodes)[keyof typeof MinistryRoleQualificationErrorCodes]
>;
