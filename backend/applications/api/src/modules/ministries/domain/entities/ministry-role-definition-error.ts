import type { NotificationError } from '@/shared/domain/notification';
export const MinistryRoleDefinitionErrorCodes = {
  ActiveNameAlreadyExists: 'ministry_role.definition.active_name_already_exists',
} as const;
export type MinistryRoleDefinitionError = NotificationError<typeof MinistryRoleDefinitionErrorCodes.ActiveNameAlreadyExists>;
