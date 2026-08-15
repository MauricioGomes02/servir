import { describe, expect, it, vi } from 'vitest';
import type { HttpClient } from '@/shared/api';
import { registerMember } from './register-member';

describe('registerMember', () => {
  it('submits the member name to its tenant-scoped BFF route', async () => {
    const member = { id: 'member-id', organizationId: 'organization-id', name: 'Maria' };
    const post = vi.fn().mockResolvedValue(member);
    const client: HttpClient = { get: vi.fn(), post };

    await expect(registerMember('organization/id', 'Maria', undefined, client)).resolves.toBe(
      member,
    );
    expect(post).toHaveBeenCalledWith(
      '/bff/organizations/organization%2Fid/members',
      { name: 'Maria' },
      undefined,
    );
  });
});
