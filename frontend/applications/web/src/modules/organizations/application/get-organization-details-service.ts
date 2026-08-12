import type { Organization, OrganizationGateway } from './organization';

export class GetOrganizationDetailsService {
  public constructor(private readonly organizations: OrganizationGateway) {}

  public execute(organizationId: string, signal?: AbortSignal): Promise<Organization> {
    return this.organizations.findById(organizationId, signal);
  }
}
