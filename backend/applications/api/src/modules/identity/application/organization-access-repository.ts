import type { OrganizationAccess } from '../domain';

export interface OrganizationAccessRepository {
  add(access: OrganizationAccess): Promise<void>;
}
