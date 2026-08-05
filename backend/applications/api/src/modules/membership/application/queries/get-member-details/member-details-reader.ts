import type { MemberId } from '@/modules/membership/domain';
import type { OrganizationId } from '@/modules/organizations/domain';

import type { MemberDetails } from './member-details';

export interface MemberDetailsReader {
  findById(
    organizationId: OrganizationId,
    memberId: MemberId,
  ): Promise<MemberDetails | undefined>;
}
