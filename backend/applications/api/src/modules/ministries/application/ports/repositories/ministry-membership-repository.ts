import type { Result } from '@/shared/core/result';
import type { MinistryMembership, MinistryMembershipRequestPolicyError } from '../../../domain';
import type { OrganizationId } from '@/modules/organizations/domain';
import type { MinistryId, MinistryMembershipId } from '../../../domain';

export interface MinistryMembershipRepository {
  add(membership: MinistryMembership): Promise<Result<void, MinistryMembershipRequestPolicyError>>;
  findById(
    organizationId: OrganizationId,
    ministryId: MinistryId,
    membershipId: MinistryMembershipId,
  ): Promise<MinistryMembership | undefined>;
  save(membership: MinistryMembership): Promise<void>;
}
