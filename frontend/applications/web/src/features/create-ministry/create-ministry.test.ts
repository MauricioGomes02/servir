import { describe, expect, it, vi } from 'vitest';
import type { HttpClient } from '@/shared/api';
import { createMinistry } from './create-ministry';

describe('createMinistry', () => {
  it('submits the ministry name to its organization BFF route', async () => {
    const ministry = { id: 'ministry-id', name: 'Música', status: 'active' } as const;
    const post = vi.fn().mockResolvedValue(ministry);
    const client: HttpClient = { get: vi.fn(), post };

    await expect(createMinistry('organization/id', ministry.name, undefined, client)).resolves.toBe(
      ministry,
    );
    expect(post).toHaveBeenCalledWith(
      '/bff/organizations/organization%2Fid/ministries',
      { name: ministry.name },
      undefined,
    );
  });
});
