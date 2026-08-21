import type { OrganizationId } from '@/modules/organizations/domain';
import type { MinistryWriteLock } from '../../application';
import type { MinistryId } from '../../domain';
import type { PoolClient } from 'pg';

export const PostgresMinistryWriteLockErrorCodes = {
  MinistryLockFailed: 'ministries.write_lock.ministry_failed',
  OrganizationLockFailed: 'ministries.write_lock.organization_failed',
} as const;

export type PostgresMinistryWriteLockErrorCode =
  (typeof PostgresMinistryWriteLockErrorCodes)[keyof typeof PostgresMinistryWriteLockErrorCodes];

export class PostgresMinistryWriteLockError extends Error {
  constructor(
    readonly code: PostgresMinistryWriteLockErrorCode,
    override readonly cause: unknown,
  ) {
    super(code, { cause });
    this.name = 'PostgresMinistryWriteLockError';
  }
}

export class PostgresMinistryWriteLock implements MinistryWriteLock {
  constructor(private readonly client: PoolClient) {}

  async acquireOrganization(organizationId: OrganizationId): Promise<void> {
    try {
      await this.client.query('SELECT id FROM organizations WHERE id = $1 FOR UPDATE', [
        organizationId.toString(),
      ]);
    } catch (cause) {
      throw new PostgresMinistryWriteLockError(
        PostgresMinistryWriteLockErrorCodes.OrganizationLockFailed,
        cause,
      );
    }
  }

  async acquireMinistry(organizationId: OrganizationId, ministryId: MinistryId): Promise<void> {
    try {
      await this.client.query(
        'SELECT id FROM ministries WHERE organization_id = $1 AND id = $2 FOR UPDATE',
        [organizationId.toString(), ministryId.toString()],
      );
    } catch (cause) {
      throw new PostgresMinistryWriteLockError(
        PostgresMinistryWriteLockErrorCodes.MinistryLockFailed,
        cause,
      );
    }
  }
}
