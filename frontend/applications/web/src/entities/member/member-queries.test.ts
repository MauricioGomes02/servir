import { describe, expect, it, vi } from 'vitest';
import type { HttpClient } from '@/shared/api';
import { getMember } from './get-member';
import { listMembers } from './list-members';

describe('member queries', () => {
  it('encodes tenant, pagination, search, and status in the member list route', async () => {
    const page = { items: [], pagination: { page: 2, pageSize: 20, totalItems: 0, totalPages: 0 } };
    const get = vi.fn().mockResolvedValue(page);
    const client: HttpClient = { get, post: vi.fn() };

    await expect(
      listMembers(
        'organization/id',
        { page: 2, pageSize: 20, search: 'Maria Silva', status: 'active' },
        undefined,
        client,
      ),
    ).resolves.toBe(page);
    expect(get).toHaveBeenCalledWith(
      '/bff/organizations/organization%2Fid/members?page=2&pageSize=20&search=Maria+Silva&status=active',
      undefined,
    );
  });

  it('loads member details from its tenant-scoped route', async () => {
    const member = {
      id: 'member-id',
      organizationId: 'organization-id',
      name: 'Maria',
      status: 'active',
    } as const;
    const get = vi.fn().mockResolvedValue(member);
    const client: HttpClient = { get, post: vi.fn() };

    await expect(getMember('organization/id', 'member/id', undefined, client)).resolves.toBe(
      member,
    );
    expect(get).toHaveBeenCalledWith(
      '/bff/organizations/organization%2Fid/members/member%2Fid',
      undefined,
    );
  });
});
