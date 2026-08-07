import { defineMessage } from '@/shared/application/mediator';
import type { ApproveMinistryMembershipHandler } from './approve-ministry-membership-handler';
import type { ApproveMinistryMembershipCommand } from './approve-ministry-membership-command';

export const ApproveMinistryMembershipMessage = defineMessage<
  ApproveMinistryMembershipCommand,
  Awaited<ReturnType<ApproveMinistryMembershipHandler['handle']>>
>('ApproveMinistryMembership', 'ministries.approve_ministry_membership');
export type * from './approve-ministry-membership-command';
export * from './approve-ministry-membership-error';
export { ApproveMinistryMembershipHandler } from './approve-ministry-membership-handler';
export type { ApproveMinistryMembershipOutput } from './approve-ministry-membership-handler';
