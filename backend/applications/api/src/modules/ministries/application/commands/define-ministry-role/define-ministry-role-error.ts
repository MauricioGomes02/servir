import type { NotificationError } from '@/shared/domain/notification';
export const DefineMinistryRoleErrorCodes = { MinistryNotFound: 'ministry_role.definition.ministry_not_found' } as const;
export type DefineMinistryRoleNotFoundError = NotificationError<typeof DefineMinistryRoleErrorCodes.MinistryNotFound>;
