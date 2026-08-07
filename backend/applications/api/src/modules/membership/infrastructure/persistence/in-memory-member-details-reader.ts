import {
  createMemberDetails,
  type MemberDetails,
  type MemberDetailsReader,
} from '../../application';
import type { Member, MemberId } from '../../domain';
import type { OrganizationId } from '@/modules/organizations/domain';

export class InMemoryMemberDetailsReader implements MemberDetailsReader {
  constructor(private readonly members: () => ReadonlyArray<Member>) {}

  async findById(
    organizationId: OrganizationId,
    memberId: MemberId,
  ): Promise<MemberDetails | undefined> {
    const member = this.members().find(
      (candidate) =>
        candidate.id.equals(memberId) && candidate.organizationId.equals(organizationId),
    );

    return member === undefined
      ? undefined
      : createMemberDetails({
          id: member.id,
          organizationId: member.organizationId,
          name: member.name.toString(),
          status: member.status,
        });
  }
}
