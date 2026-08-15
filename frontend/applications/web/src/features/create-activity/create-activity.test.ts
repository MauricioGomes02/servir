import { describe, expect, it, vi } from 'vitest';
import type { HttpClient } from '@/shared/api';
import { createActivity } from './create-activity';

describe('createActivity', () => {
  it('sends the recognized name and participating ministries through the BFF', async () => {
    const post = vi.fn().mockResolvedValue({ id: 'activity-id' });
    const client = { get: vi.fn(), post } as unknown as HttpClient;
    await createActivity(
      'organization-id',
      { name: 'Culto de domingo', ministryIds: ['ministry-id'] },
      undefined,
      client,
    );
    expect(post).toHaveBeenCalledWith(
      '/bff/organizations/organization-id/activities',
      { name: 'Culto de domingo', ministryIds: ['ministry-id'] },
      undefined,
    );
  });
});
