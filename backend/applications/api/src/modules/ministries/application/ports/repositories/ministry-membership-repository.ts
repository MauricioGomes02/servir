import type { Result } from '@/shared/core/result';
import type { MinistryMembership, MinistryMembershipRequestPolicyError } from '../../../domain';

export interface MinistryMembershipRepository {
  add(membership: MinistryMembership): Promise<Result<void, MinistryMembershipRequestPolicyError>>;
}
