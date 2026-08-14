import { describe, expect, it, vi } from 'vitest';
import type { HttpClient } from '@/shared/api';
import { createOrganization } from './create-organization';

describe('createOrganization', () => {
  it('submits the organization name to the BFF', async () => {
    const organization = { id: 'organization-id', name: 'Comunidade Servir' };
    const post = vi.fn().mockResolvedValue(organization);
    const client: HttpClient = { get: vi.fn(), post };

    await expect(createOrganization(organization.name, undefined, client)).resolves.toBe(
      organization,
    );
    expect(post).toHaveBeenCalledWith('/bff/organizations', { name: organization.name }, undefined);
  });
});
