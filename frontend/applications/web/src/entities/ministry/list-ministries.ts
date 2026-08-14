import { httpClient, type HttpClient } from '@/shared/api';
import type { MinistryListFilters, MinistryPage } from './model';

function listPath(organizationId: string, filters: MinistryListFilters): string {
  const query = new URLSearchParams();
  if (filters.page !== undefined) query.set('page', String(filters.page));
  if (filters.pageSize !== undefined) query.set('pageSize', String(filters.pageSize));
  if (filters.search) query.set('search', filters.search);
  if (filters.status) query.set('status', filters.status);
  const suffix = query.size > 0 ? `?${query.toString()}` : '';
  return `/bff/organizations/${encodeURIComponent(organizationId)}/ministries${suffix}`;
}

export function listMinistries(
  organizationId: string,
  filters: MinistryListFilters,
  signal?: AbortSignal,
  client: HttpClient = httpClient,
): Promise<MinistryPage> {
  return client.get(listPath(organizationId, filters), signal);
}
