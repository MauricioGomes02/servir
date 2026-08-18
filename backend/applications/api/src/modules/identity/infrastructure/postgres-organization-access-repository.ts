import type { OrganizationAccessRepository } from '../application';
import type { OrganizationAccess } from '../domain';
import type { PoolClient } from 'pg';

export class PostgresOrganizationAccessRepository implements OrganizationAccessRepository {
  constructor(private readonly client: PoolClient) {}

  async add(access: OrganizationAccess): Promise<void> {
    await this.client.query(
      `INSERT INTO organization_accesses (id, organization_id, user_id, member_id, role, status)
       VALUES ($1, $2, $3, NULL, $4, $5)`,
      [
        access.id.toString(),
        access.organizationId.toString(),
        access.userId.toString(),
        access.role,
        access.status,
      ],
    );
  }
}
