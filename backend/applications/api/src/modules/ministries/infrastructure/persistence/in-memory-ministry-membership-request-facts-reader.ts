import type { Member } from '@/modules/membership/domain';
import type { MemberId } from '@/modules/membership/domain';
import type { OrganizationId } from '@/modules/organizations/domain';
import type { MinistryMembershipRequestFactsReader } from '../../application';
import type { Ministry, MinistryId, MinistryMembership } from '../../domain';

export class InMemoryMinistryMembershipRequestFactsReader implements MinistryMembershipRequestFactsReader {
  constructor(
    private readonly members: () => readonly Member[],
    private readonly ministries: () => readonly Ministry[],
    private readonly memberships: () => readonly MinistryMembership[],
  ) {}

  async findFor(organizationId: OrganizationId, ministryId: MinistryId, memberId: MemberId) {
    return Object.freeze({
      memberIsActive: this.members().some(
        (member) =>
          member.organizationId.equals(organizationId) &&
          member.id.equals(memberId) &&
          member.status === 'active',
      ),
      ministryIsActive: this.ministries().some(
        (ministry) =>
          ministry.organizationId.equals(organizationId) &&
          ministry.id.equals(ministryId) &&
          ministry.status === 'active',
      ),
      currentMembershipExists: this.memberships().some(
        (membership) =>
          membership.organizationId.equals(organizationId) &&
          membership.ministryId.equals(ministryId) &&
          membership.memberId.equals(memberId) &&
          (membership.status === 'requested' || membership.status === 'active'),
      ),
    });
  }
}
