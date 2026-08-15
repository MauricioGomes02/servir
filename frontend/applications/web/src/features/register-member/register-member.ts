import { httpClient, type HttpClient } from '@/shared/api';

export interface RegisteredMember {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
}

export function registerMember(
  organizationId: string,
  name: string,
  signal?: AbortSignal,
  client: HttpClient = httpClient,
): Promise<RegisteredMember> {
  return client.post(
    `/bff/organizations/${encodeURIComponent(organizationId)}/members`,
    { name },
    signal,
  );
}
