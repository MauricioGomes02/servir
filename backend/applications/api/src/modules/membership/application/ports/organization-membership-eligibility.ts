import type { OrganizationId } from '@/modules/organizations/domain';

export interface OrganizationMembershipEligibility {
  allowsMemberRegistration(
    organizationId: OrganizationId,
  ): Promise<boolean>;
}
