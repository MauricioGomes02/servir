import type { OrganizationId } from '@/modules/organizations/domain';
import type { UserId } from '../domain';

export interface OrganizationAccessReader {
  hasActiveAccess(organizationId: OrganizationId, userId: UserId): Promise<boolean>;
}
