import { OrganizationId } from '@/modules/organizations/domain';
import { MemberId } from '@/modules/membership/domain';
import type { OrganizationAccessRepository } from '../application';
import {
  OrganizationAccess,
  OrganizationAccessId,
  OrganizationAccessRoles,
  OrganizationAccessStatuses,
  UserId,
  type OrganizationAccessRole,
  type OrganizationAccessStatus,
} from '../domain';
import type { PoolClient, QueryResult, QueryResultRow } from 'pg';

export const PostgresOrganizationAccessRepositoryErrorCodes = {
  AddFailed: 'identity.organization_access_repository.add_failed',
  InvalidPersistedRole: 'identity.organization_access_repository.invalid_persisted_role',
  InvalidPersistedStatus: 'identity.organization_access_repository.invalid_persisted_status',
  InvalidPersistedValue: 'identity.organization_access_repository.invalid_persisted_value',
  MissingOnSave: 'identity.organization_access_repository.missing_on_save',
  ReadFailed: 'identity.organization_access_repository.read_failed',
  SaveFailed: 'identity.organization_access_repository.save_failed',
  UntrackedOnSave: 'identity.organization_access_repository.untracked_on_save',
} as const;

export type PostgresOrganizationAccessRepositoryErrorCode =
  (typeof PostgresOrganizationAccessRepositoryErrorCodes)[keyof typeof PostgresOrganizationAccessRepositoryErrorCodes];

export class PostgresOrganizationAccessRepositoryError extends Error {
  constructor(
    readonly code: PostgresOrganizationAccessRepositoryErrorCode,
    override readonly cause: unknown,
  ) {
    super(code, { cause });
    this.name = 'PostgresOrganizationAccessRepositoryError';
  }
}

interface OrganizationAccessRow {
  readonly id: string;
  readonly member_id: string | null;
  readonly organization_id: string;
  readonly role: string;
  readonly status: string;
  readonly user_id: string;
}

function value<T>(result: { success: true; value: T } | { success: false }): T {
  if (!result.success) {
    throw new PostgresOrganizationAccessRepositoryError(
      PostgresOrganizationAccessRepositoryErrorCodes.InvalidPersistedValue,
      result,
    );
  }
  return result.value;
}

function role(input: string): OrganizationAccessRole {
  if (input === OrganizationAccessRoles.Owner) return input;
  throw new PostgresOrganizationAccessRepositoryError(
    PostgresOrganizationAccessRepositoryErrorCodes.InvalidPersistedRole,
    input,
  );
}

function status(input: string): OrganizationAccessStatus {
  if (input === OrganizationAccessStatuses.Active || input === OrganizationAccessStatuses.Revoked) {
    return input;
  }
  throw new PostgresOrganizationAccessRepositoryError(
    PostgresOrganizationAccessRepositoryErrorCodes.InvalidPersistedStatus,
    input,
  );
}

function reconstitute(row: OrganizationAccessRow): OrganizationAccess {
  return OrganizationAccess.reconstitute({
    id: value(OrganizationAccessId.create(row.id)),
    ...(row.member_id === null ? {} : { memberId: value(MemberId.create(row.member_id)) }),
    organizationId: value(OrganizationId.create(row.organization_id)),
    role: role(row.role),
    status: status(row.status),
    userId: value(UserId.create(row.user_id)),
  });
}

const SELECT_ACCESS = `SELECT id, organization_id, user_id, member_id, role, status
  FROM organization_accesses`;

interface OrganizationAccessSnapshot {
  readonly memberId: string | null;
  readonly role: OrganizationAccessRole;
  readonly status: OrganizationAccessStatus;
}

function snapshot(access: OrganizationAccess): OrganizationAccessSnapshot {
  return Object.freeze({
    memberId: access.memberId?.toString() ?? null,
    role: access.role,
    status: access.status,
  });
}

export class PostgresOrganizationAccessRepository implements OrganizationAccessRepository {
  private readonly snapshots = new WeakMap<OrganizationAccess, OrganizationAccessSnapshot>();

  constructor(private readonly client: PoolClient) {}

  private async query<TRow extends QueryResultRow = QueryResultRow>(
    errorCode: PostgresOrganizationAccessRepositoryErrorCode,
    text: string,
    values: readonly unknown[],
  ): Promise<QueryResult<TRow>> {
    try {
      return await this.client.query<TRow>(text, [...values]);
    } catch (cause) {
      throw new PostgresOrganizationAccessRepositoryError(errorCode, cause);
    }
  }

  async add(access: OrganizationAccess): Promise<void> {
    await this.query(
      PostgresOrganizationAccessRepositoryErrorCodes.AddFailed,
      `INSERT INTO organization_accesses (id, organization_id, user_id, member_id, role, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        access.id.toString(),
        access.organizationId.toString(),
        access.userId.toString(),
        access.memberId?.toString() ?? null,
        access.role,
        access.status,
      ],
    );
    this.snapshots.set(access, snapshot(access));
  }

  async findById(
    organizationId: OrganizationId,
    accessId: OrganizationAccessId,
  ): Promise<OrganizationAccess | null> {
    const result = await this.query<OrganizationAccessRow>(
      PostgresOrganizationAccessRepositoryErrorCodes.ReadFailed,
      `${SELECT_ACCESS}
        WHERE organization_id = $1 AND id = $2`,
      [organizationId.toString(), accessId.toString()],
    );
    if (result.rows[0] === undefined) return null;
    const access = reconstitute(result.rows[0]);
    this.snapshots.set(access, snapshot(access));
    return access;
  }

  async save(access: OrganizationAccess): Promise<void> {
    const previous = this.snapshots.get(access);
    if (previous === undefined) {
      throw new PostgresOrganizationAccessRepositoryError(
        PostgresOrganizationAccessRepositoryErrorCodes.UntrackedOnSave,
        access.id,
      );
    }
    const current = snapshot(access);
    const changes: Array<Readonly<{ column: string; value: unknown }>> = [];
    if (previous.memberId !== current.memberId) {
      changes.push({ column: 'member_id', value: current.memberId });
    }
    if (previous.role !== current.role) changes.push({ column: 'role', value: current.role });
    if (previous.status !== current.status) {
      changes.push({ column: 'status', value: current.status });
    }
    if (changes.length === 0) return;
    const values = changes.map((change) => change.value);
    values.push(access.id.toString(), access.organizationId.toString());
    const updated = await this.query(
      PostgresOrganizationAccessRepositoryErrorCodes.SaveFailed,
      `UPDATE organization_accesses
          SET ${changes.map((change, index) => `${change.column} = $${index + 1}`).join(', ')}
        WHERE id = $${changes.length + 1} AND organization_id = $${changes.length + 2}`,
      values,
    );
    if (updated.rowCount !== 1) {
      throw new PostgresOrganizationAccessRepositoryError(
        PostgresOrganizationAccessRepositoryErrorCodes.MissingOnSave,
        access.id,
      );
    }
    this.snapshots.set(access, current);
  }
}
