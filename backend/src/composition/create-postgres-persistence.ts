import type { OrganizationWriteScope } from '@/modules/organizations/application';
import { PostgresOrganizationRepository } from '@/modules/organizations/infrastructure';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import { PostgresEventOutbox } from '@/shared/infrastructure/messaging';
import { PostgresUnitOfWork } from '@/shared/infrastructure/unit-of-work';
import { Pool } from 'pg';

export interface PostgresPersistence {
  readonly unitOfWork: UnitOfWork<OrganizationWriteScope>;
  close(): Promise<void>;
}

export function createPostgresPersistence(
  connectionString: string,
): PostgresPersistence {
  const pool = new Pool({ connectionString });

  return {
    unitOfWork: new PostgresUnitOfWork(pool, (client) => ({
      organizations: new PostgresOrganizationRepository(client),
      outbox: new PostgresEventOutbox(client),
    })),
    async close(): Promise<void> {
      await pool.end();
    },
  };
}
