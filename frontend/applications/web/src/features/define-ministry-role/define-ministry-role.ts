import type { MinistryRoleSummary } from '@/entities/ministry';
import { httpClient, type HttpClient } from '@/shared/api';

export function defineMinistryRole(
  organizationId: string,
  ministryId: string,
  name: string,
  signal?: AbortSignal,
  client: HttpClient = httpClient,
): Promise<MinistryRoleSummary> {
  return client.post(
    `/bff/organizations/${encodeURIComponent(organizationId)}/ministries/${encodeURIComponent(ministryId)}/roles`,
    { name },
    signal,
  );
}
