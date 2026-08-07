export { RegisterMemberHandler } from './register-member-handler';

export type { RegisterMemberCommand } from './register-member-command';

export type { RegisterMemberDependencies, RegisterMemberOutput } from './register-member-handler';
import { defineMessage } from '@/shared/application/mediator';
import type { RegisterMemberCommand } from './register-member-command';
import type { RegisterMemberHandler } from './register-member-handler';

export const RegisterMemberMessage = defineMessage<
  RegisterMemberCommand,
  Awaited<ReturnType<RegisterMemberHandler['handle']>>
>('membership.register-member', 'RegisterMember');
