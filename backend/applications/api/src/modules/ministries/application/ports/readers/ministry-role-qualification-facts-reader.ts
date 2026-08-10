import type { OrganizationId } from '@/modules/organizations/domain';
import type { MinistryId, MinistryRoleId } from '../../../domain';
export interface MinistryRoleQualificationFactsReader {
  isRoleActive(
    organizationId: OrganizationId,
    ministryId: MinistryId,
    ministryRoleId: MinistryRoleId,
  ): Promise<boolean>;
}
