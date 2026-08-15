import { httpClient, type HttpClient } from '@/shared/api';

export interface CreatedActivity {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly ministryIds: readonly string[];
  readonly status: 'active';
}

export function createActivity(
  organizationId: string,
  input: Readonly<{ name: string; ministryIds: readonly string[] }>,
  signal?: AbortSignal,
  client: HttpClient = httpClient,
): Promise<CreatedActivity> {
  return client.post(
    `/bff/organizations/${encodeURIComponent(organizationId)}/activities`,
    input,
    signal,
  );
}
