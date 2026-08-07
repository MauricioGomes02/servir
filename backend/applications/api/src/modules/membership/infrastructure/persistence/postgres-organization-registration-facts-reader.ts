import type { OrganizationId } from '@/modules/organizations/domain';
import type { Pool } from 'pg';

import type { OrganizationRegistrationFactsReader } from '../../application';
import type { OrganizationRegistrationFacts } from '../../domain';
import { PostgresOrganizationRegistrationFactsReaderError } from './postgres-organization-registration-facts-reader-error';

export class PostgresOrganizationRegistrationFactsReader implements OrganizationRegistrationFactsReader {
  constructor(private readonly pool: Pool) {}

  async findById(
    organizationId: OrganizationId,
  ): Promise<OrganizationRegistrationFacts | undefined> {
    try {
      const result = await this.pool.query('SELECT 1 FROM organizations WHERE id = $1', [
        organizationId.toString(),
      ]);

      return result.rowCount === 0 ? undefined : Object.freeze({ organizationId });
    } catch (cause) {
      throw new PostgresOrganizationRegistrationFactsReaderError(cause);
    }
  }
}
