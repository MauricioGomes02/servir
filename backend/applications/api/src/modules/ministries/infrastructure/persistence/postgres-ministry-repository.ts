import { failure, success } from '@/shared/core/result';
import type { PoolClient, QueryResultRow } from 'pg';
import { OrganizationId } from '@/modules/organizations/domain';
import type { MinistryRepository } from '../../application';
import {
  Ministry,
  MinistryCreationPolicy,
  MinistryId,
  MinistryName,
  MinistryRole,
  MinistryRoleDefinitionErrorCodes,
  MinistryRoleId,
  MinistryRoleName,
} from '../../domain';
import { fromMinistryStatusCode, toMinistryStatusCode } from './ministry-status-code';
import { fromMinistryRoleStatusCode, toMinistryRoleStatusCode } from './ministry-role-status-code';
import { PostgresMinistryRepositoryError } from './postgres-ministry-repository-error';

interface MinistryWithRoleRow extends QueryResultRow {
  readonly id: string;
  readonly organization_id: string;
  readonly name: string;
  readonly status: unknown;
  readonly role_id: string | null;
  readonly role_name: unknown;
  readonly role_status: unknown;
}

export class PostgresMinistryRepository implements MinistryRepository {
  constructor(private readonly client: PoolClient) {}

  async add(ministry: Ministry) {
    try {
      const result = await this.client.query<MinistryWithRoleRow>(
        `INSERT INTO ministries (id, organization_id, name, status)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (organization_id, lower(name)) WHERE status = 1
         DO NOTHING
         RETURNING id`,
        [
          ministry.id.toString(),
          ministry.organizationId.toString(),
          ministry.name.toString(),
          toMinistryStatusCode(ministry.status),
        ],
      );
      return result.rowCount === 0
        ? failure(new MinistryCreationPolicy().activeNameConflict())
        : success();
    } catch (cause) {
      throw new PostgresMinistryRepositoryError(cause);
    }
  }

  async findById(organizationId: OrganizationId, ministryId: MinistryId) {
    try {
      const result = await this.client.query<MinistryWithRoleRow>(
        `SELECT m.id, m.organization_id, m.name, m.status,
                r.id AS role_id, r.name AS role_name, r.status AS role_status
         FROM ministries m
         LEFT JOIN ministry_roles r
           ON r.organization_id = m.organization_id AND r.ministry_id = m.id
         WHERE m.id = $1 AND m.organization_id = $2
         ORDER BY r.id`,
        [ministryId.toString(), organizationId.toString()],
      );
      if (result.rowCount === 0) return undefined;
      const first = result.rows[0];
      const parsedId = MinistryId.create(first.id);
      const parsedOrganizationId = OrganizationId.create(first.organization_id);
      const parsedName = MinistryName.create(first.name);
      if (!parsedId.success || !parsedOrganizationId.success || !parsedName.success)
        throw new Error('invalid_persisted_ministry');
      const roles = result.rows.flatMap((row) => {
        if (row.role_id === null) return [];
        const roleId = MinistryRoleId.create(row.role_id);
        const roleName = MinistryRoleName.create(row.role_name);
        if (!roleId.success || !roleName.success)
          throw new Error('invalid_persisted_ministry_role');
        return [
          MinistryRole.reconstitute(
            roleId.value,
            roleName.value,
            fromMinistryRoleStatusCode(row.role_status),
          ),
        ];
      });
      return Ministry.reconstitute({
        id: parsedId.value,
        organizationId: parsedOrganizationId.value,
        name: parsedName.value,
        status: fromMinistryStatusCode(first.status),
        roles,
      });
    } catch (cause) {
      throw new PostgresMinistryRepositoryError(cause);
    }
  }

  async save(ministry: Ministry) {
    try {
      const persisted = await this.client.query<{ id: string }>(
        'SELECT id FROM ministry_roles WHERE organization_id = $1 AND ministry_id = $2',
        [ministry.organizationId.toString(), ministry.id.toString()],
      );
      const ids = new Set(persisted.rows.map((row) => row.id));
      for (const role of ministry.roles.filter((candidate) => !ids.has(candidate.id.toString()))) {
        const result = await this.client.query(
          `INSERT INTO ministry_roles (id, organization_id, ministry_id, name, status)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (organization_id, ministry_id, lower(name)) WHERE status = 1
           DO NOTHING RETURNING id`,
          [
            role.id.toString(),
            ministry.organizationId.toString(),
            ministry.id.toString(),
            role.name.toString(),
            toMinistryRoleStatusCode(role.status),
          ],
        );
        if (result.rowCount === 0)
          return failure({
            code: MinistryRoleDefinitionErrorCodes.ActiveNameAlreadyExists,
            field: 'name',
          });
      }
      return success();
    } catch (cause) {
      throw new PostgresMinistryRepositoryError(cause);
    }
  }
}
