import type { MemberId } from '@/modules/membership/domain';
import type { OrganizationId } from '@/modules/organizations/domain';

import type {
  MemberAccessInvitationId,
  MemberAccessInvitationTokenDigest,
  UserId,
} from '../domain';

export interface MemberAccessInvitationAcceptanceLock {
  acquireInvitation(
    tokenDigest: MemberAccessInvitationTokenDigest,
  ): Promise<MemberAccessInvitationId | null>;
  acquireMember(organizationId: OrganizationId, memberId: MemberId): Promise<void>;
  acquireUser(userId: UserId): Promise<void>;
}
