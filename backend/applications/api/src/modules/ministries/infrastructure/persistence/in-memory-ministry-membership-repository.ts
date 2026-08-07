import { failure, success } from '@/shared/core/result';
import type { MinistryMembershipRepository } from '../../application';
import { MinistryMembershipRequestPolicyErrorCodes, type MinistryMembership } from '../../domain';

export class InMemoryMinistryMembershipRepository implements MinistryMembershipRepository {
  private readonly stored: MinistryMembership[] = [];

  async add(membership: MinistryMembership) {
    const conflict = this.stored.some(
      (candidate) =>
        candidate.ministryId.equals(membership.ministryId) &&
        candidate.memberId.equals(membership.memberId) &&
        (candidate.status === 'requested' || candidate.status === 'active'),
    );
    if (conflict)
      return failure({
        code: MinistryMembershipRequestPolicyErrorCodes.CurrentMembershipAlreadyExists,
        field: 'memberId' as const,
      });
    this.stored.push(membership);
    return success();
  }

  async findById(
    organizationId: Parameters<MinistryMembershipRepository['findById']>[0],
    ministryId: Parameters<MinistryMembershipRepository['findById']>[1],
    membershipId: Parameters<MinistryMembershipRepository['findById']>[2],
  ) {
    return this.stored.find(
      (candidate) =>
        candidate.id.equals(membershipId) &&
        candidate.organizationId.equals(organizationId) &&
        candidate.ministryId.equals(ministryId),
    );
  }

  async save(_membership: MinistryMembership): Promise<void> {}

  get memberships(): readonly MinistryMembership[] {
    return Object.freeze([...this.stored]);
  }
}
