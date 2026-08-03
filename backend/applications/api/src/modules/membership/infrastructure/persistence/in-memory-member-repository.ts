import type { MemberRepository } from '../../application';
import type { Member } from '../../domain';

export class InMemoryMemberRepository implements MemberRepository {
  private readonly storedMembers: Member[] = [];

  async save(member: Member): Promise<void> {
    this.storedMembers.push(member);
  }

  get members(): ReadonlyArray<Member> {
    return Object.freeze([...this.storedMembers]);
  }
}
