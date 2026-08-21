import type { MinistryMembership } from '../../../domain';
import type { OrganizationId } from '@/modules/organizations/domain';
import type { MinistryId, MinistryMembershipId } from '../../../domain';

export interface MinistryMembershipRepository {
  add(membership: MinistryMembership): Promise<void>;
  findById(
    organizationId: OrganizationId,
    ministryId: MinistryId,
    membershipId: MinistryMembershipId,
  ): Promise<MinistryMembership | undefined>;
  save(membership: MinistryMembership): Promise<void>;
}
