import { describe, expect, it, vi } from 'vitest';
import type { HttpClient } from '@/shared/api';
import { defineMinistryRole } from './define-ministry-role';

describe('defineMinistryRole', () => {
  it('submits the role name to its tenant-scoped ministry route', async () => {
    const role = { id: 'role-id', name: 'Guitarra', status: 'active' } as const;
    const post = vi.fn().mockResolvedValue(role);
    const client: HttpClient = { get: vi.fn(), post };

    await expect(
      defineMinistryRole('organization/id', 'ministry/id', role.name, undefined, client),
    ).resolves.toBe(role);
    expect(post).toHaveBeenCalledWith(
      '/bff/organizations/organization%2Fid/ministries/ministry%2Fid/roles',
      { name: role.name },
      undefined,
    );
  });
});
