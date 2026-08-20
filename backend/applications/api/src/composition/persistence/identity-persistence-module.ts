import type { OrganizationAccessReader, UserProvisioner } from '@/modules/identity/application';
import {
  PostgresOrganizationAccessReader,
  PostgresUserProvisioner,
} from '@/modules/identity/infrastructure';

import type { PostgresPersistenceBuilder } from './postgres-persistence-builder';
import { defineService } from '../services';

export const userProvisioner = defineService<UserProvisioner>('identity.user-provisioner');
export const organizationAccessReader = defineService<OrganizationAccessReader>(
  'identity.organization-access-reader',
);

export function registerIdentityPersistence(builder: PostgresPersistenceBuilder): void {
  builder.addValue(userProvisioner, (pool) => new PostgresUserProvisioner(pool));
  builder.addValue(organizationAccessReader, (pool) => new PostgresOrganizationAccessReader(pool));
}
