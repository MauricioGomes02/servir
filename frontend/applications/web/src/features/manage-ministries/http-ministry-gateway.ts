import { httpClient, type HttpClient } from '@/shared/http/http-client';
import type { MinistryGateway, MinistryListFilters } from './ministry';

function listPath(organizationId: string, filters: MinistryListFilters): string {
  const query = new URLSearchParams();
  if (filters.page !== undefined) query.set('page', String(filters.page));
  if (filters.pageSize !== undefined) query.set('pageSize', String(filters.pageSize));
  if (filters.search) query.set('search', filters.search);
  if (filters.status) query.set('status', filters.status);
  const suffix = query.size > 0 ? `?${query.toString()}` : '';
  return `/bff/organizations/${encodeURIComponent(organizationId)}/ministries${suffix}`;
}

export function createHttpMinistryGateway(client: HttpClient): MinistryGateway {
  return {
    list: (organizationId, filters, signal) =>
      client.get(listPath(organizationId, filters), signal),
    create: (organizationId, name, signal) =>
      client.post(
        `/bff/organizations/${encodeURIComponent(organizationId)}/ministries`,
        { name },
        signal,
      ),
  };
}

export const ministryGateway = createHttpMinistryGateway(httpClient);
