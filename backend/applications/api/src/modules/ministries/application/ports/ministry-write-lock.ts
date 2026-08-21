import type { OrganizationId } from '@/modules/organizations/domain';
import type { MinistryId } from '../../domain';

export interface MinistryWriteLock {
  acquireOrganization(organizationId: OrganizationId): Promise<void>;
  acquireMinistry(organizationId: OrganizationId, ministryId: MinistryId): Promise<void>;
}
