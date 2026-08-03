import type { OrganizationId } from '@/modules/organizations/domain';

import type { OrganizationMembershipEligibility } from '../../application';

export class InMemoryOrganizationMembershipEligibility
implements OrganizationMembershipEligibility {
  private readonly eligibleOrganizationIds: ReadonlySet<string>;

  constructor(organizationIds: ReadonlyArray<OrganizationId>) {
    this.eligibleOrganizationIds = new Set(
      organizationIds.map((organizationId) => organizationId.toString()),
    );
  }

  async allowsMemberRegistration(
    organizationId: OrganizationId,
  ): Promise<boolean> {
    return this.eligibleOrganizationIds.has(organizationId.toString());
  }
}
