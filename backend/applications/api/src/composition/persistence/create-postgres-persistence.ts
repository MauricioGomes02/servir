import { Pool } from 'pg';
import { registerActivitiesPersistence } from './activities-persistence-module';
import { registerAvailabilityPersistence } from './availability-persistence-module';
import { registerIdentityPersistence } from './identity-persistence-module';
import { registerMembershipPersistence } from './membership-persistence-module';
import { registerMinistriesPersistence } from './ministries-persistence-module';
import { registerOrganizationsPersistence } from './organizations-persistence-module';
import type { ApplicationPersistence } from './application-persistence';
import { PostgresPersistenceBuilder } from './postgres-persistence-builder';

export type PostgresPersistence = ApplicationPersistence;

export function createPostgresPersistence(connectionString: string): PostgresPersistence {
  const pool = new Pool({ connectionString });
  const builder = new PostgresPersistenceBuilder(pool);

  registerOrganizationsPersistence(builder);
  registerIdentityPersistence(builder);
  registerMembershipPersistence(builder);
  registerMinistriesPersistence(builder);
  registerActivitiesPersistence(builder);
  registerAvailabilityPersistence(builder);

  return {
    services: builder.services,
    async close(): Promise<void> {
      await pool.end();
    },
  };
}
