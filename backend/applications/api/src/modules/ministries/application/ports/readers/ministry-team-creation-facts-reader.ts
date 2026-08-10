import type { OrganizationId } from '@/modules/organizations/domain';
import type { MinistryId, MinistryTeamCreationFacts, MinistryTeamName } from '../../../domain';
export interface MinistryTeamCreationFactsReader {
  find(
    organizationId: OrganizationId,
    ministryId: MinistryId,
    name: MinistryTeamName,
  ): Promise<MinistryTeamCreationFacts>;
}
