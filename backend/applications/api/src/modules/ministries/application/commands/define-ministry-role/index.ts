export { DefineMinistryRoleHandler } from './define-ministry-role-handler';
export { DefineMinistryRoleErrorCodes } from './define-ministry-role-error';
export type { DefineMinistryRoleCommand } from './define-ministry-role-command';
export type { DefineMinistryRoleOutput } from './define-ministry-role-handler';
export type { DefineMinistryRoleNotFoundError } from './define-ministry-role-error';
import { defineMessage } from '@/shared/application/mediator';
import type { DefineMinistryRoleCommand } from './define-ministry-role-command';
import type { DefineMinistryRoleHandler } from './define-ministry-role-handler';

export const DefineMinistryRoleMessage = defineMessage<
  DefineMinistryRoleCommand,
  Awaited<ReturnType<DefineMinistryRoleHandler['handle']>>
>('ministries.define-ministry-role', 'DefineMinistryRole');
