import type { OrganizationId } from '@/modules/organizations/domain';

import type { OrganizationRegistrationFactsReader } from '../../application';
import type { OrganizationRegistrationFacts } from '../../domain';

export class InMemoryOrganizationRegistrationFactsReader
implements OrganizationRegistrationFactsReader {
  private readonly organizationsById:
    ReadonlyMap<string, OrganizationRegistrationFacts>;

  constructor(organizationIds: ReadonlyArray<OrganizationId>) {
    this.organizationsById = new Map(
      organizationIds.map((organizationId) => [
        organizationId.toString(),
        Object.freeze({ organizationId }),
      ]),
    );
  }

  async findById(
    organizationId: OrganizationId,
  ): Promise<OrganizationRegistrationFacts | undefined> {
    return this.organizationsById.get(organizationId.toString());
  }
}
