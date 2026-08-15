import type { UserProvisioner, UserProvisioningResult } from '../application';
import { ExternalIdentity, User, UserId, UserStatuses, type UserStatus } from '../domain';
import type { Pool, PoolClient } from 'pg';

import { PostgresUserProvisionerError } from './postgres-user-provisioner-error';

const EXTERNAL_IDENTITY_UNIQUE_CONSTRAINT = 'user_external_identities_issuer_subject_key';

interface PostgresErrorLike {
  readonly code?: string;
  readonly constraint?: string;
}

interface UserRow {
  readonly id: string;
  readonly issuer: string;
  readonly status: number;
  readonly subject: string;
}

function isExternalIdentityConflict(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const postgresError = error as PostgresErrorLike;
  return (
    postgresError.code === '23505' &&
    postgresError.constraint === EXTERNAL_IDENTITY_UNIQUE_CONSTRAINT
  );
}

function userStatus(code: number): UserStatus {
  if (code === 1) return UserStatuses.Active;
  if (code === 2) return UserStatuses.Inactive;
  throw new PostgresUserProvisionerError(new Error('identity.user_status.unknown'));
}

function requireValue<T>(result: { success: true; value: T } | { success: false }): T {
  if (!result.success) {
    throw new PostgresUserProvisionerError(new Error('identity.persisted_value.invalid'));
  }
  return result.value;
}

function reconstituteUser(rows: readonly UserRow[]): User {
  const first = rows[0];
  if (first === undefined) {
    throw new PostgresUserProvisionerError(new Error('identity.user.not_found_after_conflict'));
  }

  const externalIdentities = rows.map((row) =>
    requireValue(ExternalIdentity.create({ issuer: row.issuer, subject: row.subject })),
  ) as [ExternalIdentity, ...ExternalIdentity[]];

  return User.reconstitute({
    id: requireValue(UserId.create(first.id)),
    externalIdentities,
    status: userStatus(first.status),
  });
}

async function findByExternalIdentity(
  client: PoolClient,
  identity: ExternalIdentity,
): Promise<User> {
  const result = await client.query<UserRow>(
    `SELECT u.id, u.status, i.issuer, i.subject
       FROM user_external_identities selected
       JOIN users u ON u.id = selected.user_id
       JOIN user_external_identities i ON i.user_id = u.id
      WHERE selected.issuer = $1 AND selected.subject = $2
      ORDER BY i.issuer, i.subject`,
    [identity.issuer, identity.subject],
  );

  return reconstituteUser(result.rows);
}

export class PostgresUserProvisioner implements UserProvisioner {
  constructor(private readonly pool: Pool) {}

  async provision(candidate: User): Promise<UserProvisioningResult> {
    const identity = candidate.externalIdentities[0];
    let client: PoolClient;
    try {
      client = await this.pool.connect();
    } catch (cause) {
      throw new PostgresUserProvisionerError(cause);
    }
    try {
      await client.query('BEGIN');
      await client.query(`INSERT INTO users (id, status) VALUES ($1, $2)`, [
        candidate.id.toString(),
        1,
      ]);
      await client.query(
        `INSERT INTO user_external_identities (user_id, issuer, subject)
         VALUES ($1, $2, $3)`,
        [candidate.id.toString(), identity.issuer, identity.subject],
      );
      await client.query('COMMIT');
      return Object.freeze({ created: true, user: candidate });
    } catch (cause) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackCause) {
        throw new PostgresUserProvisionerError(
          new AggregateError([cause, rollbackCause], 'identity.user_provisioning.rollback_failed'),
        );
      }
      if (isExternalIdentityConflict(cause)) {
        try {
          const user = await findByExternalIdentity(client, identity);
          return Object.freeze({ created: false, user });
        } catch (conflictReadCause) {
          if (conflictReadCause instanceof PostgresUserProvisionerError) throw conflictReadCause;
          throw new PostgresUserProvisionerError(conflictReadCause);
        }
      }
      throw new PostgresUserProvisionerError(cause);
    } finally {
      client.release();
    }
  }
}
