import type { UserProvisioner } from '@/modules/identity/application';
import { PostgresUserProvisioner } from '@/modules/identity/infrastructure';

import type { PostgresPersistenceBuilder } from '../persistence';
import { defineService } from '../services';

export const userProvisioner = defineService<UserProvisioner>('identity.user-provisioner');

export function registerIdentityPersistence(builder: PostgresPersistenceBuilder): void {
  builder.addValue(userProvisioner, (pool) => new PostgresUserProvisioner(pool));
}
