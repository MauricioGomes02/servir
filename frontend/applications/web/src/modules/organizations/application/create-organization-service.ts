import type { Organization, OrganizationGateway } from './organization';

export class CreateOrganizationService {
  public constructor(private readonly organizations: OrganizationGateway) {}

  public execute(name: string, signal?: AbortSignal): Promise<Organization> {
    return this.organizations.create(name, signal);
  }
}
