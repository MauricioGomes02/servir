import type { MinistrySummary } from '@/entities/ministry';
import { httpClient, type HttpClient } from '@/shared/api';

export function createMinistry(
  organizationId: string,
  name: string,
  signal?: AbortSignal,
  client: HttpClient = httpClient,
): Promise<MinistrySummary> {
  return client.post(
    `/bff/organizations/${encodeURIComponent(organizationId)}/ministries`,
    { name },
    signal,
  );
}
