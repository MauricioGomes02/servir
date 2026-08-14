import type { Organization } from '@/entities/organization';
import { httpClient, type HttpClient } from '@/shared/api';

export function createOrganization(
  name: string,
  signal?: AbortSignal,
  client: HttpClient = httpClient,
): Promise<Organization> {
  return client.post('/bff/organizations', { name }, signal);
}
