export type { RequestMinistryMembershipCommand } from './request-ministry-membership-command';
export { RequestMinistryMembershipHandler } from './request-ministry-membership-handler';
export type {
  RequestMinistryMembershipDependencies,
  RequestMinistryMembershipOutput,
} from './request-ministry-membership-handler';
import { defineMessage } from '@/shared/application/mediator';
import type { RequestMinistryMembershipCommand } from './request-ministry-membership-command';
import type { RequestMinistryMembershipHandler } from './request-ministry-membership-handler';

export const RequestMinistryMembershipMessage = defineMessage<
  RequestMinistryMembershipCommand,
  Awaited<ReturnType<RequestMinistryMembershipHandler['handle']>>
>('ministries.request-ministry-membership', 'RequestMinistryMembership');
