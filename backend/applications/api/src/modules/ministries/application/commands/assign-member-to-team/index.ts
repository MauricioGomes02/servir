import { defineMessage } from '@/shared/application/mediator';
import type { AssignMemberToTeamCommand } from './assign-member-to-team-command';
import type { AssignMemberToTeamHandler } from './assign-member-to-team-handler';
export const AssignMemberToTeamMessage = defineMessage<
  AssignMemberToTeamCommand,
  Awaited<ReturnType<AssignMemberToTeamHandler['handle']>>
>('ministries.assign-member-to-team', 'AssignMemberToTeam');
export type * from './assign-member-to-team-command';
export { AssignMemberToTeamHandler } from './assign-member-to-team-handler';
export type {
  AssignMemberToTeamError,
  AssignMemberToTeamOutput,
} from './assign-member-to-team-handler';
