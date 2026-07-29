import type { PoolClient } from 'pg';

import type { OrganizationRepository } from '../../application';
import type { Organization } from '../../domain';
import { PostgresOrganizationRepositoryError } from './postgres-organization-repository-error';

export class PostgresOrganizationRepository
implements OrganizationRepository {
  constructor(private readonly client: PoolClient) {}

  async save(organization: Organization): Promise<void> {
    try {
      await this.client.query(
        `INSERT INTO organizations (id, name)
         VALUES ($1, $2)`,
        [organization.id.toString(), organization.name.toString()],
      );
    } catch (cause) {
      throw new PostgresOrganizationRepositoryError(cause);
    }
  }
}
