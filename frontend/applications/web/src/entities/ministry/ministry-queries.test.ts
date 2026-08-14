import { describe, expect, it, vi } from 'vitest';
import type { HttpClient } from '@/shared/api';
import { getMinistry } from './get-ministry';
import { listMinistries } from './list-ministries';

describe('ministry queries', () => {
  it('requests an encoded ministry resource from the BFF', async () => {
    const ministry = { id: 'ministry/id', name: 'Música', status: 'active', roles: [] } as const;
    const get = vi.fn().mockResolvedValue(ministry);
    const client: HttpClient = { get, post: vi.fn() };

    await expect(getMinistry('organization/id', ministry.id, undefined, client)).resolves.toBe(
      ministry,
    );
    expect(get).toHaveBeenCalledWith(
      '/bff/organizations/organization%2Fid/ministries/ministry%2Fid',
      undefined,
    );
  });

  it('serializes supported list filters into the BFF query', async () => {
    const page = {
      items: [],
      pagination: { page: 2, pageSize: 10, totalItems: 0, totalPages: 0 },
    };
    const get = vi.fn().mockResolvedValue(page);
    const client: HttpClient = { get, post: vi.fn() };

    await expect(
      listMinistries(
        'organization/id',
        { page: 2, pageSize: 10, search: 'Louvor e música', status: 'active' },
        undefined,
        client,
      ),
    ).resolves.toBe(page);
    expect(get).toHaveBeenCalledWith(
      '/bff/organizations/organization%2Fid/ministries?page=2&pageSize=10&search=Louvor+e+m%C3%BAsica&status=active',
      undefined,
    );
  });
});
