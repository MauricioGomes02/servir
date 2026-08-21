import type { OrganizationId } from '@/modules/organizations/domain';
import type { OrganizationAccess, OrganizationAccessId } from '../domain';

export interface OrganizationAccessRepository {
  add(access: OrganizationAccess): Promise<void>;
  findById(
    organizationId: OrganizationId,
    accessId: OrganizationAccessId,
  ): Promise<OrganizationAccess | null>;
  save(access: OrganizationAccess): Promise<void>;
}
