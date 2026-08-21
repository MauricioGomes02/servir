import type { MemberId } from '@/modules/membership/domain';
import type { OrganizationId } from '@/modules/organizations/domain';
import type { MinistryMembershipWriteLock } from '../../application';
import type { MinistryId, MinistryMembershipId } from '../../domain';
import type { PoolClient } from 'pg';

export const PostgresMinistryMembershipWriteLockErrorCodes = {
  MembershipLockFailed: 'ministries.membership_write_lock.membership_failed',
  RequestLockFailed: 'ministries.membership_write_lock.request_failed',
} as const;

export type PostgresMinistryMembershipWriteLockErrorCode =
  (typeof PostgresMinistryMembershipWriteLockErrorCodes)[keyof typeof PostgresMinistryMembershipWriteLockErrorCodes];

export class PostgresMinistryMembershipWriteLockError extends Error {
  constructor(
    readonly code: PostgresMinistryMembershipWriteLockErrorCode,
    override readonly cause: unknown,
  ) {
    super(code, { cause });
    this.name = 'PostgresMinistryMembershipWriteLockError';
  }
}

export class PostgresMinistryMembershipWriteLock implements MinistryMembershipWriteLock {
  constructor(private readonly client: PoolClient) {}

  async acquireMembership(
    organizationId: OrganizationId,
    ministryId: MinistryId,
    membershipId: MinistryMembershipId,
  ): Promise<void> {
    try {
      await this.client.query(
        `SELECT id FROM ministry_memberships
          WHERE organization_id = $1 AND ministry_id = $2 AND id = $3
          FOR UPDATE`,
        [organizationId.toString(), ministryId.toString(), membershipId.toString()],
      );
    } catch (cause) {
      throw new PostgresMinistryMembershipWriteLockError(
        PostgresMinistryMembershipWriteLockErrorCodes.MembershipLockFailed,
        cause,
      );
    }
  }

  async acquireRequest(
    organizationId: OrganizationId,
    ministryId: MinistryId,
    memberId: MemberId,
  ): Promise<void> {
    try {
      await this.client.query(
        'SELECT id FROM ministries WHERE organization_id = $1 AND id = $2 FOR UPDATE',
        [organizationId.toString(), ministryId.toString()],
      );
      await this.client.query(
        'SELECT id FROM members WHERE organization_id = $1 AND id = $2 FOR UPDATE',
        [organizationId.toString(), memberId.toString()],
      );
    } catch (cause) {
      throw new PostgresMinistryMembershipWriteLockError(
        PostgresMinistryMembershipWriteLockErrorCodes.RequestLockFailed,
        cause,
      );
    }
  }
}
