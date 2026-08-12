export interface Organization {
  readonly id: string;
  readonly name: string;
}

export interface OrganizationGateway {
  create(name: string, signal?: AbortSignal): Promise<Organization>;
  findById(organizationId: string, signal?: AbortSignal): Promise<Organization>;
}
