import type { OrganizationId } from '@/modules/organizations/domain';
import type { PoolClient } from 'pg';
import type { MinistryCreationFactsReader } from '../../application';
import type { MinistryName } from '../../domain';
import { PostgresMinistryCreationFactsReaderError } from './postgres-ministry-creation-facts-reader-error';

export class PostgresMinistryCreationFactsReader implements MinistryCreationFactsReader {
  constructor(private readonly client: PoolClient) {}

  async find(organizationId: OrganizationId, name: MinistryName) {
    try {
      const result = await this.client.query<{
        organization_exists: boolean;
        active_name_exists: boolean;
      }>(
        `SELECT
           EXISTS (SELECT 1 FROM organizations WHERE id = $1) AS organization_exists,
           EXISTS (
             SELECT 1 FROM ministries
             WHERE organization_id = $1 AND status = 1 AND lower(name) = lower($2)
           ) AS active_name_exists`,
        [organizationId.toString(), name.toString()],
      );
      const row = result.rows[0];
      return Object.freeze({
        organizationExists: row?.organization_exists ?? false,
        activeNameExists: row?.active_name_exists ?? false,
      });
    } catch (cause) {
      throw new PostgresMinistryCreationFactsReaderError(cause);
    }
  }
}
