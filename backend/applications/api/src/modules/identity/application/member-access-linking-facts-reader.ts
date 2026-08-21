import type { MemberId, MemberStatus } from '@/modules/membership/domain';
import type { OrganizationId } from '@/modules/organizations/domain';
import type { OrganizationAccessId, OrganizationAccessStatus, UserId } from '../domain';

export interface MemberAccessLinkingAccessFact {
  readonly accessId: OrganizationAccessId;
  readonly memberId?: MemberId;
  readonly status: OrganizationAccessStatus;
  readonly userId: UserId;
}

export interface MemberAccessLinkingFacts {
  readonly accesses: readonly MemberAccessLinkingAccessFact[];
  readonly memberStatus: MemberStatus | null;
}

export interface MemberAccessLinkingFactsReader {
  find(input: {
    readonly memberId: MemberId;
    readonly organizationId: OrganizationId;
    readonly userId: UserId;
  }): Promise<MemberAccessLinkingFacts>;
}
