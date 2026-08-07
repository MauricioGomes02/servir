import type { OrganizationId } from '@/modules/organizations/domain';
import type { MinistryCreationFactsReader } from '../../application';
import type { Ministry, MinistryName } from '../../domain';

export class InMemoryMinistryCreationFactsReader implements MinistryCreationFactsReader {
  constructor(
    private readonly organizationIds: () => ReadonlyArray<OrganizationId>,
    private readonly ministries: () => ReadonlyArray<Ministry>,
  ) {}

  async find(organizationId: OrganizationId, name: MinistryName) {
    return Object.freeze({
      organizationExists: this.organizationIds().some((id) => id.equals(organizationId)),
      activeNameExists: this.ministries().some(
        (ministry) =>
          ministry.organizationId.equals(organizationId) &&
          ministry.status === 'active' &&
          ministry.name.toString().toLowerCase() === name.toString().toLowerCase(),
      ),
    });
  }
}
