import type { OrganizationId } from '@/modules/organizations/domain';

import type { OrganizationRegistrationFacts } from '../../../domain';

export interface OrganizationRegistrationFactsReader {
  findById(organizationId: OrganizationId): Promise<OrganizationRegistrationFacts | undefined>;
}
