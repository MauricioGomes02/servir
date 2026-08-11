import { Pool } from 'pg';
import { registerActivitiesPersistence } from './modules/activities-persistence-module';
import { registerAvailabilityPersistence } from './modules/availability-persistence-module';
import { registerMembershipPersistence } from './modules/membership-persistence-module';
import { registerMinistriesPersistence } from './modules/ministries-persistence-module';
import { registerOrganizationsPersistence } from './modules/organizations-persistence-module';
import type { ApplicationPersistence } from './persistence';
import { PostgresPersistenceBuilder } from './persistence';

export type PostgresPersistence = ApplicationPersistence;

export function createPostgresPersistence(connectionString: string): PostgresPersistence {
  const pool = new Pool({ connectionString });
  const builder = new PostgresPersistenceBuilder(pool);

  registerOrganizationsPersistence(builder);
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
