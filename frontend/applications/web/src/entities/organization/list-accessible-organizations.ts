import { httpClient, type HttpClient } from '@/shared/api';
import type { Organization } from './model';

export interface AccessibleOrganizationList {
  readonly items: readonly Organization[];
}

export function listAccessibleOrganizations(
  signal?: AbortSignal,
  client: HttpClient = httpClient,
): Promise<AccessibleOrganizationList> {
  return client.get('/bff/organizations', signal);
}
