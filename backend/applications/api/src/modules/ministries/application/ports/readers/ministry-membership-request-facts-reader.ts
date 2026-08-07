import type { MemberId } from '@/modules/membership/domain';
import type { OrganizationId } from '@/modules/organizations/domain';
import type { MinistryMembershipRequestFacts, MinistryId } from '../../../domain';

export interface MinistryMembershipRequestFactsReader {
  findFor(
    organizationId: OrganizationId,
    ministryId: MinistryId,
    memberId: MemberId,
  ): Promise<MinistryMembershipRequestFacts>;
}
