import type { MemberStatus } from '@/modules/membership/domain';
import type { MemberId } from '@/modules/membership/domain';
import type { OrganizationId } from '@/modules/organizations/domain';

export interface MemberDetails {
  readonly id: MemberId;
  readonly organizationId: OrganizationId;
  readonly name: string;
  readonly status: MemberStatus;
}

export function createMemberDetails(details: MemberDetails): MemberDetails {
  return Object.freeze({ ...details });
}
