import { httpClient, type HttpClient } from '@/shared/api';
import type { MemberListFilters, MemberPage } from './model';

function listPath(organizationId: string, filters: MemberListFilters): string {
  const query = new URLSearchParams();
  if (filters.page !== undefined) query.set('page', String(filters.page));
  if (filters.pageSize !== undefined) query.set('pageSize', String(filters.pageSize));
  if (filters.search) query.set('search', filters.search);
  if (filters.status) query.set('status', filters.status);
  const suffix = query.size > 0 ? `?${query.toString()}` : '';
  return `/bff/organizations/${encodeURIComponent(organizationId)}/members${suffix}`;
}

export function listMembers(
  organizationId: string,
  filters: MemberListFilters,
  signal?: AbortSignal,
  client: HttpClient = httpClient,
): Promise<MemberPage> {
  return client.get(listPath(organizationId, filters), signal);
}
