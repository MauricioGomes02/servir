import { defineMessage } from '@/shared/application/mediator';
import type {
  AcceptMemberAccessInvitationCommand,
  AcceptMemberAccessInvitationHandler,
} from './accept-member-access-invitation';
import type {
  InviteMemberToAccessCommand,
  InviteMemberToAccessHandler,
} from './invite-member-to-access';

export const InviteMemberToAccessMessage = defineMessage<
  InviteMemberToAccessCommand,
  Awaited<ReturnType<InviteMemberToAccessHandler['handle']>>
>('identity.invite-member-to-access', 'InviteMemberToAccess');

export const AcceptMemberAccessInvitationMessage = defineMessage<
  AcceptMemberAccessInvitationCommand,
  Awaited<ReturnType<AcceptMemberAccessInvitationHandler['handle']>>
>('identity.accept-member-access-invitation', 'AcceptMemberAccessInvitation');
