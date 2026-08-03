import type { Member } from '../../domain';

export interface MemberRepository {
  save(member: Member): Promise<void>;
}
