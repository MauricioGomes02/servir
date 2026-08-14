import { httpClient, type HttpClient } from '@/shared/api';
import type { MinistryDetails } from './model';

export function getMinistry(
  organizationId: string,
  ministryId: string,
  signal?: AbortSignal,
  client: HttpClient = httpClient,
): Promise<MinistryDetails> {
  return client.get(
    `/bff/organizations/${encodeURIComponent(organizationId)}/ministries/${encodeURIComponent(ministryId)}`,
    signal,
  );
}
