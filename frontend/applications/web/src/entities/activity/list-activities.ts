import { httpClient, type HttpClient } from '@/shared/api';
import type { ActivityListFilters, ActivityPage } from './model';

function listPath(organizationId: string, filters: ActivityListFilters): string {
  const query = new URLSearchParams();
  if (filters.page !== undefined) query.set('page', String(filters.page));
  if (filters.pageSize !== undefined) query.set('pageSize', String(filters.pageSize));
  if (filters.search) query.set('search', filters.search);
  if (filters.status) query.set('status', filters.status);
  const suffix = query.size > 0 ? `?${query.toString()}` : '';
  return `/bff/organizations/${encodeURIComponent(organizationId)}/activities${suffix}`;
}

export function listActivities(
  organizationId: string,
  filters: ActivityListFilters,
  signal?: AbortSignal,
  client: HttpClient = httpClient,
): Promise<ActivityPage> {
  return client.get(listPath(organizationId, filters), signal);
}
