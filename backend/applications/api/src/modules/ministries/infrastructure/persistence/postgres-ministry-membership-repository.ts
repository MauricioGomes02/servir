import { failure, success } from '@/shared/core/result';
import type { MinistryMembershipRepository } from '../../application';
import { MinistryMembership, MinistryMembershipRequestPolicyErrorCodes } from '../../domain';
import type { PoolClient, QueryResultRow } from 'pg';
import { OrganizationId } from '@/modules/organizations/domain';
import { MemberId } from '@/modules/membership/domain';
import { Instant } from '@/shared/domain/instant';
import { MinistryId, MinistryMembershipId } from '../../domain';
import {
  fromMinistryMembershipStatusCode,
  toMinistryMembershipStatusCode,
} from './ministry-membership-status-code';
import { PostgresMinistryMembershipRepositoryError } from './postgres-ministry-membership-repository-error';

interface MinistryMembershipRow extends QueryResultRow {
  readonly id: unknown;
  readonly organization_id: unknown;
  readonly ministry_id: unknown;
  readonly member_id: unknown;
  readonly status: unknown;
  readonly requested_at: unknown;
  readonly approved_at: unknown;
}

function persistedInstant(value: unknown) {
  return Instant.create(value instanceof Date ? value.toISOString() : value);
}

export class PostgresMinistryMembershipRepository implements MinistryMembershipRepository {
  constructor(private readonly client: PoolClient) {}

  async add(membership: MinistryMembership) {
    try {
      const result = await this.client.query<MinistryMembershipRow>(
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

  async findById(
    organizationId: OrganizationId,
    ministryId: MinistryId,
    membershipId: MinistryMembershipId,
  ) {
    try {
      const result = await this.client.query<MinistryMembershipRow>(
        `SELECT id, organization_id, ministry_id, member_id, status, requested_at, approved_at FROM ministry_memberships WHERE id = $1 AND organization_id = $2 AND ministry_id = $3`,
        [membershipId.value, organizationId.value, ministryId.value],
      );
      if (result.rowCount === 0) return undefined;
      const row = result.rows[0];
      const id = MinistryMembershipId.create(row.id);
      const organization = OrganizationId.create(row.organization_id);
      const ministry = MinistryId.create(row.ministry_id);
      const member = MemberId.create(row.member_id);
      const requestedAt = persistedInstant(row.requested_at);
      const approvedAt = row.approved_at === null ? undefined : persistedInstant(row.approved_at);
      if (
        !id.success ||
        !organization.success ||
        !ministry.success ||
        !member.success ||
        !requestedAt.success ||
        (approvedAt !== undefined && !approvedAt.success)
      )
        throw new Error('invalid_persisted_ministry_membership');
      return MinistryMembership.reconstitute({
        id: id.value,
        organizationId: organization.value,
        ministryId: ministry.value,
        memberId: member.value,
        status: fromMinistryMembershipStatusCode(row.status),
        requestedAt: requestedAt.value,
        approvedAt: approvedAt?.value,
      });
    } catch (cause) {
      throw new PostgresMinistryMembershipRepositoryError(cause);
    }
  }

  async save(membership: MinistryMembership): Promise<void> {
    try {
      await this.client.query(
        'UPDATE ministry_memberships SET status = $1, approved_at = $2 WHERE id = $3',
        [
          toMinistryMembershipStatusCode(membership.status),
          membership.approvedAt?.toISOString() ?? null,
          membership.id.value,
        ],
      );
    } catch (cause) {
      throw new PostgresMinistryMembershipRepositoryError(cause);
    }
  }
}
