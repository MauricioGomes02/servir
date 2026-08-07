export { CreateMinistryHandler } from './create-ministry-handler';
export type { CreateMinistryCommand } from './create-ministry-command';
export type { CreateMinistryDependencies, CreateMinistryOutput } from './create-ministry-handler';
import { defineMessage } from '@/shared/application/mediator';
import type { CreateMinistryCommand } from './create-ministry-command';
import type { CreateMinistryHandler } from './create-ministry-handler';

export const CreateMinistryMessage = defineMessage<
  CreateMinistryCommand,
  Awaited<ReturnType<CreateMinistryHandler['handle']>>
>('ministries.create-ministry', 'CreateMinistry');
