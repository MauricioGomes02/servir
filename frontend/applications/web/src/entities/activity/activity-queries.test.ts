import { describe, expect, it, vi } from 'vitest';
import { getActivity } from './get-activity';
import { listActivities } from './list-activities';
import type { HttpClient } from '@/shared/api';

describe('activity queries', () => {
  it('encodes tenant, filters and activity identity in BFF requests', async () => {
    const client = {
      get: vi.fn().mockResolvedValue({ items: [], pagination: {} }),
      post: vi.fn(),
    } as unknown as HttpClient;
    await listActivities(
      'organization/id',
      { page: 2, search: 'Culto', status: 'active' },
      undefined,
      client,
    );
    await getActivity('organization/id', 'activity/id', undefined, client);
    expect(client.get).toHaveBeenNthCalledWith(
      1,
      '/bff/organizations/organization%2Fid/activities?page=2&search=Culto&status=active',
      undefined,
    );
    expect(client.get).toHaveBeenNthCalledWith(
      2,
      '/bff/organizations/organization%2Fid/activities/activity%2Fid',
      undefined,
    );
  });
});
