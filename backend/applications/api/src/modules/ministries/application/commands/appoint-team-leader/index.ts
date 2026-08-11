import { defineMessage } from '@/shared/application/mediator';
import type { AppointTeamLeaderCommand } from './appoint-team-leader-command';
import type { AppointTeamLeaderHandler } from './appoint-team-leader-handler';

export const AppointTeamLeaderMessage = defineMessage<
  AppointTeamLeaderCommand,
  Awaited<ReturnType<AppointTeamLeaderHandler['handle']>>
>('ministries.appoint-team-leader', 'AppointTeamLeader');
export type * from './appoint-team-leader-command';
export { AppointTeamLeaderHandler } from './appoint-team-leader-handler';
export type {
  AppointTeamLeaderError,
  AppointTeamLeaderOutput,
} from './appoint-team-leader-handler';
