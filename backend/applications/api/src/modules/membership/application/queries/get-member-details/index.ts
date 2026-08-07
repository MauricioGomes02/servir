export { GetMemberDetailsHandler } from './get-member-details-handler';
export { GetMemberDetailsErrorCodes } from './get-member-details-error';
export { createMemberDetails } from './member-details';

export type { GetMemberDetailsQuery } from './get-member-details-query';
export type { GetMemberDetailsError } from './get-member-details-error';
export type { MemberDetails } from './member-details';
export type { MemberDetailsReader } from './member-details-reader';
import { defineMessage } from '@/shared/application/mediator';
import type { GetMemberDetailsHandler } from './get-member-details-handler';
import type { GetMemberDetailsQuery } from './get-member-details-query';

export const GetMemberDetailsMessage = defineMessage<
  GetMemberDetailsQuery,
  Awaited<ReturnType<GetMemberDetailsHandler['handle']>>
>('membership.get-member-details', 'GetMemberDetails');
