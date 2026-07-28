import type { OrganizationRepository } from '../../application';
import type { Organization } from '../../domain';

export class InMemoryOrganizationRepository
implements OrganizationRepository {
  private readonly storedOrganizations: Organization[] = [];

  async save(organization: Organization): Promise<void> {
    this.storedOrganizations.push(organization);
  }

  get organizations(): ReadonlyArray<Organization> {
    return Object.freeze([...this.storedOrganizations]);
  }
}
