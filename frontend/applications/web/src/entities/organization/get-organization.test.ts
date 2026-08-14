import { describe, expect, it, vi } from 'vitest';
import type { HttpClient } from '@/shared/api';
import { getOrganization } from './get-organization';

describe('getOrganization', () => {
  it('requests the organization from its BFF route', async () => {
    const organization = { id: 'organization/id', name: 'Comunidade Servir' };
    const get = vi.fn().mockResolvedValue(organization);
    const client: HttpClient = { get, post: vi.fn() };

    await expect(getOrganization(organization.id, undefined, client)).resolves.toBe(organization);
    expect(get).toHaveBeenCalledWith('/bff/organizations/organization%2Fid', undefined);
  });
});
