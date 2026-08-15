import { httpClient, type HttpClient } from '@/shared/api';
import type { MemberDetails } from './model';

export function getMember(
  organizationId: string,
  memberId: string,
  signal?: AbortSignal,
  client: HttpClient = httpClient,
): Promise<MemberDetails> {
  return client.get(
    `/bff/organizations/${encodeURIComponent(organizationId)}/members/${encodeURIComponent(memberId)}`,
    signal,
  );
}
