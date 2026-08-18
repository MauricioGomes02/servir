import { describe, expect, it, vi } from 'vitest';
import { listAccessibleOrganizations } from './list-accessible-organizations';

describe('listAccessibleOrganizations', () => {
  it('requests the organizations accessible to the current session', async () => {
    const result = { items: [{ id: 'organization-id', name: 'Comunidade Servir' }] };
    const get = vi.fn().mockResolvedValue(result);

    await expect(listAccessibleOrganizations(undefined, { get, post: vi.fn() })).resolves.toBe(
      result,
    );
    expect(get).toHaveBeenCalledWith('/bff/organizations', undefined);
  });
});
