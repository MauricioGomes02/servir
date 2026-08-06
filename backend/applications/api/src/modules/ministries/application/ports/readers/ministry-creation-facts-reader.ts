import type { OrganizationId } from '@/modules/organizations/domain';
import type { MinistryCreationFacts, MinistryName } from '../../../domain';

export interface MinistryCreationFactsReader {
  find(organizationId: OrganizationId, name: MinistryName): Promise<MinistryCreationFacts>;
}
