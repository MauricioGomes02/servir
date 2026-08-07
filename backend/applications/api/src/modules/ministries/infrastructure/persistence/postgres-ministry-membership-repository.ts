import { failure, success } from '@/shared/core/result';
import type { MinistryMembershipRepository } from '../../application';
import { MinistryMembershipRequestPolicyErrorCodes, type MinistryMembership } from '../../domain';
import type { PoolClient } from 'pg';
import { PostgresMinistryMembershipRepositoryError } from './postgres-ministry-membership-repository-error';

export class PostgresMinistryMembershipRepository implements MinistryMembershipRepository {
  constructor(private readonly client: PoolClient) {}

  async add(membership: MinistryMembership) {
    try {
      const result = await this.client.query(
        `INSERT INTO ministry_memberships (id, organization_id, ministry_id, member_id, status, requested_at)
       VALUES ($1, $2, $3, $4, 1, $5)
       ON CONFLICT (ministry_id, member_id) WHERE status IN (1, 2)
       DO NOTHING RETURNING id`,
        [
          membership.id.toString(),
          membership.organizationId.toString(),
          membership.ministryId.toString(),
          membership.memberId.toString(),
          membership.requestedAt.toISOString(),
        ],
      );
      return result.rowCount === 0
        ? failure({
            code: MinistryMembershipRequestPolicyErrorCodes.CurrentMembershipAlreadyExists,
            field: 'memberId' as const,
          })
        : success();
    } catch (cause) {
      throw new PostgresMinistryMembershipRepositoryError(cause);
    }
  }
}
