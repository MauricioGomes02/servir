import type { MemberId } from '@/modules/membership/domain';
import type { OrganizationId } from '@/modules/organizations/domain';
import type { MinistryId, MinistryMembershipId } from '../../domain';

export interface MinistryMembershipWriteLock {
  acquireMembership(
    organizationId: OrganizationId,
    ministryId: MinistryId,
    membershipId: MinistryMembershipId,
  ): Promise<void>;
  acquireRequest(
    organizationId: OrganizationId,
    ministryId: MinistryId,
    memberId: MemberId,
  ): Promise<void>;
}
