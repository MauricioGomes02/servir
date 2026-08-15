import { httpClient, type HttpClient } from '@/shared/api';
import type { ActivityDetails } from './model';

export function getActivity(
  organizationId: string,
  activityId: string,
  signal?: AbortSignal,
  client: HttpClient = httpClient,
): Promise<ActivityDetails> {
  return client.get(
    `/bff/organizations/${encodeURIComponent(organizationId)}/activities/${encodeURIComponent(activityId)}`,
    signal,
  );
}
