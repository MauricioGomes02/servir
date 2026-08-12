import type { OrganizationGateway } from '@/modules/organizations/application/organization';
import { httpClient, type HttpClient } from '@/shared/http/http-client';

export function createHttpOrganizationGateway(client: HttpClient): OrganizationGateway {
  return {
    create: (name, signal) => client.post('/bff/organizations', { name }, signal),
    findById: (organizationId, signal) =>
      client.get(`/bff/organizations/${encodeURIComponent(organizationId)}`, signal),
  };
}

export const organizationGateway = createHttpOrganizationGateway(httpClient);
