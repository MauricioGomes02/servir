import { httpClient, type HttpClient } from '@/shared/api';
import type { Organization } from './model';

export function getOrganization(
  organizationId: string,
  signal?: AbortSignal,
  client: HttpClient = httpClient,
): Promise<Organization> {
  return client.get(`/bff/organizations/${encodeURIComponent(organizationId)}`, signal);
}
