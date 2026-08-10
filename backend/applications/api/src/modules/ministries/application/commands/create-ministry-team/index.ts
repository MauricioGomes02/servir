import { defineMessage } from '@/shared/application/mediator';
import type { CreateMinistryTeamCommand } from './create-ministry-team-command';
import type { CreateMinistryTeamHandler } from './create-ministry-team-handler';
export const CreateMinistryTeamMessage = defineMessage<
  CreateMinistryTeamCommand,
  Awaited<ReturnType<CreateMinistryTeamHandler['handle']>>
>('ministries.create-ministry-team', 'CreateMinistryTeam');
export type * from './create-ministry-team-command';
export { CreateMinistryTeamHandler } from './create-ministry-team-handler';
export type {
  CreateMinistryTeamError,
  CreateMinistryTeamOutput,
} from './create-ministry-team-handler';
