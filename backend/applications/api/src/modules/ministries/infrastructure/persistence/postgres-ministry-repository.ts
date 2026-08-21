import { OrganizationId } from '@/modules/organizations/domain';
import type { MinistryRepository } from '../../application';
import {
  Ministry,
  MinistryId,
  MinistryName,
  MinistryRole,
  MinistryRoleId,
  MinistryRoleName,
  type MinistryRoleStatus,
  type MinistryStatus,
} from '../../domain';
import type { PoolClient, QueryResult, QueryResultRow } from 'pg';
import { fromMinistryRoleStatusCode, toMinistryRoleStatusCode } from './ministry-role-status-code';
import { fromMinistryStatusCode, toMinistryStatusCode } from './ministry-status-code';
import {
  PostgresMinistryRepositoryError,
  PostgresMinistryRepositoryErrorCodes,
  type PostgresMinistryRepositoryErrorCode,
} from './postgres-ministry-repository-error';

interface MinistryWithRoleRow extends QueryResultRow {
  readonly id: string;
  readonly name: unknown;
  readonly organization_id: string;
  readonly role_id: string | null;
  readonly role_name: unknown;
  readonly role_status: unknown;
  readonly status: unknown;
}

interface MinistryRoleSnapshot {
  readonly name: string;
  readonly status: MinistryRoleStatus;
}

interface MinistrySnapshot {
  readonly name: string;
  readonly roles: Readonly<Record<string, MinistryRoleSnapshot>>;
  readonly status: MinistryStatus;
}

function value<T>(result: { success: true; value: T } | { success: false }): T {
  if (!result.success) {
    throw new PostgresMinistryRepositoryError(
      PostgresMinistryRepositoryErrorCodes.InvalidPersistedValue,
      result,
    );
  }
  return result.value;
}

function ministryStatus(input: unknown): MinistryStatus {
  try {
    return fromMinistryStatusCode(input);
  } catch (cause) {
    throw new PostgresMinistryRepositoryError(
      PostgresMinistryRepositoryErrorCodes.InvalidPersistedValue,
      cause,
    );
  }
}

function roleStatus(input: unknown): MinistryRoleStatus {
  try {
    return fromMinistryRoleStatusCode(input);
  } catch (cause) {
    throw new PostgresMinistryRepositoryError(
      PostgresMinistryRepositoryErrorCodes.InvalidPersistedValue,
      cause,
    );
  }
}

function snapshot(ministry: Ministry): MinistrySnapshot {
  return Object.freeze({
    name: ministry.name.toString(),
    roles: Object.freeze(
      Object.fromEntries(
        ministry.roles.map((role) => [
          role.id.toString(),
          Object.freeze({ name: role.name.toString(), status: role.status }),
        ]),
      ),
    ),
    status: ministry.status,
  });
}

function reconstitute(rows: readonly MinistryWithRoleRow[]): Ministry {
  const first = rows[0];
  if (first === undefined) {
    throw new PostgresMinistryRepositoryError(
      PostgresMinistryRepositoryErrorCodes.InvalidPersistedValue,
      rows,
    );
  }
  const roles = rows.flatMap((row) => {
    if (row.role_id === null) return [];
    return [
      MinistryRole.reconstitute(
        value(MinistryRoleId.create(row.role_id)),
        value(MinistryRoleName.create(row.role_name)),
        roleStatus(row.role_status),
      ),
    ];
  });
  return Ministry.reconstitute({
    id: value(MinistryId.create(first.id)),
    organizationId: value(OrganizationId.create(first.organization_id)),
    name: value(MinistryName.create(first.name)),
    roles,
    status: ministryStatus(first.status),
  });
}

export class PostgresMinistryRepository implements MinistryRepository {
  private readonly snapshots = new WeakMap<Ministry, MinistrySnapshot>();

  constructor(private readonly client: PoolClient) {}

  private async query<TRow extends QueryResultRow = QueryResultRow>(
    errorCode: PostgresMinistryRepositoryErrorCode,
    text: string,
    values: readonly unknown[],
  ): Promise<QueryResult<TRow>> {
    try {
      return await this.client.query<TRow>(text, [...values]);
    } catch (cause) {
      if (cause instanceof PostgresMinistryRepositoryError) throw cause;
      throw new PostgresMinistryRepositoryError(errorCode, cause);
    }
  }

  async add(ministry: Ministry): Promise<void> {
    await this.query(
      PostgresMinistryRepositoryErrorCodes.AddFailed,
      `INSERT INTO ministries (id, organization_id, name, status)
       VALUES ($1, $2, $3, $4)`,
      [
        ministry.id.toString(),
        ministry.organizationId.toString(),
        ministry.name.toString(),
        toMinistryStatusCode(ministry.status),
      ],
    );
    for (const role of ministry.roles) {
      await this.insertRole(ministry, role, PostgresMinistryRepositoryErrorCodes.AddFailed);
    }
    this.snapshots.set(ministry, snapshot(ministry));
  }

  async findById(
    organizationId: OrganizationId,
    ministryId: MinistryId,
  ): Promise<Ministry | undefined> {
    const result = await this.query<MinistryWithRoleRow>(
      PostgresMinistryRepositoryErrorCodes.ReadFailed,
      `SELECT m.id, m.organization_id, m.name, m.status,
              r.id AS role_id, r.name AS role_name, r.status AS role_status
         FROM ministries m
         LEFT JOIN ministry_roles r
           ON r.organization_id = m.organization_id AND r.ministry_id = m.id
        WHERE m.id = $1 AND m.organization_id = $2
        ORDER BY r.id`,
      [ministryId.toString(), organizationId.toString()],
    );
    if (result.rows.length === 0) return undefined;
    const ministry = reconstitute(result.rows);
    this.snapshots.set(ministry, snapshot(ministry));
    return ministry;
  }

  async save(ministry: Ministry): Promise<void> {
    const previous = this.snapshots.get(ministry);
    if (previous === undefined) {
      throw new PostgresMinistryRepositoryError(
        PostgresMinistryRepositoryErrorCodes.UntrackedOnSave,
        ministry.id,
      );
    }
    const current = snapshot(ministry);
    const ministryChanges: Array<Readonly<{ column: string; value: unknown }>> = [];
    if (previous.name !== current.name) {
      ministryChanges.push({ column: 'name', value: current.name });
    }
    if (previous.status !== current.status) {
      ministryChanges.push({ column: 'status', value: toMinistryStatusCode(current.status) });
    }
    if (ministryChanges.length > 0) {
      const values = ministryChanges.map((change) => change.value);
      values.push(ministry.id.toString(), ministry.organizationId.toString());
      const updated = await this.query(
        PostgresMinistryRepositoryErrorCodes.SaveFailed,
        `UPDATE ministries
            SET ${ministryChanges.map((change, index) => `${change.column} = $${index + 1}`).join(', ')}
          WHERE id = $${ministryChanges.length + 1}
            AND organization_id = $${ministryChanges.length + 2}`,
        values,
      );
      this.requireUpdated(updated, ministry.id);
    }

    for (const role of ministry.roles) {
      const priorRole = previous.roles[role.id.toString()];
      if (priorRole === undefined) {
        await this.insertRole(ministry, role, PostgresMinistryRepositoryErrorCodes.SaveFailed);
        continue;
      }
      const roleChanges: Array<Readonly<{ column: string; value: unknown }>> = [];
      if (priorRole.name !== role.name.toString()) {
        roleChanges.push({ column: 'name', value: role.name.toString() });
      }
      if (priorRole.status !== role.status) {
        roleChanges.push({ column: 'status', value: toMinistryRoleStatusCode(role.status) });
      }
      if (roleChanges.length === 0) continue;
      const values = roleChanges.map((change) => change.value);
      values.push(role.id.toString(), ministry.id.toString(), ministry.organizationId.toString());
      const updated = await this.query(
        PostgresMinistryRepositoryErrorCodes.SaveFailed,
        `UPDATE ministry_roles
            SET ${roleChanges.map((change, index) => `${change.column} = $${index + 1}`).join(', ')}
          WHERE id = $${roleChanges.length + 1}
            AND ministry_id = $${roleChanges.length + 2}
            AND organization_id = $${roleChanges.length + 3}`,
        values,
      );
      this.requireUpdated(updated, role.id);
    }
    this.snapshots.set(ministry, current);
  }

  private async insertRole(
    ministry: Ministry,
    role: MinistryRole,
    errorCode: PostgresMinistryRepositoryErrorCode,
  ): Promise<void> {
    await this.query(
      errorCode,
      `INSERT INTO ministry_roles (id, organization_id, ministry_id, name, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        role.id.toString(),
        ministry.organizationId.toString(),
        ministry.id.toString(),
        role.name.toString(),
        toMinistryRoleStatusCode(role.status),
      ],
    );
  }

  private requireUpdated(result: QueryResult, identity: unknown): void {
    if (result.rowCount === 1) return;
    throw new PostgresMinistryRepositoryError(
      PostgresMinistryRepositoryErrorCodes.MissingOnSave,
      identity,
    );
  }
}
