import { defineMessage } from '@/shared/application/mediator';
import type { QualifyMemberForMinistryRoleHandler } from './qualify-member-for-ministry-role-handler';
import type { QualifyMemberForMinistryRoleCommand } from './qualify-member-for-ministry-role-command';
export const QualifyMemberForMinistryRoleMessage = defineMessage<
  QualifyMemberForMinistryRoleCommand,
  Awaited<ReturnType<QualifyMemberForMinistryRoleHandler['handle']>>
>('QualifyMemberForMinistryRole', 'ministries.qualify_member_for_ministry_role');
export type * from './qualify-member-for-ministry-role-command';
export * from './qualify-member-for-ministry-role-error';
export { QualifyMemberForMinistryRoleHandler } from './qualify-member-for-ministry-role-handler';
export type {
  QualifyMemberForMinistryRoleError,
  QualifyMemberForMinistryRoleOutput,
} from './qualify-member-for-ministry-role-handler';
