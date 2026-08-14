import { render } from '@testing-library/vue';
import { RouterLinkStub } from '@vue/test-utils';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MinistryDetailsPage from './MinistryDetailsPage.vue';

const requests = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal()),
  httpClient: requests,
}));

function renderView() {
  return render(MinistryDetailsPage, {
    props: { organizationId: 'organization-id', ministryId: 'ministry-id' },
    global: { stubs: { RouterLink: RouterLinkStub } },
  });
}

describe('MinistryDetailsPage', () => {
  beforeEach(() => requests.get.mockReset());

  it('presents the ministry and its real functions without speculative sections', async () => {
    requests.get.mockResolvedValue({
      id: 'ministry-id',
      name: 'Louvor',
      status: 'active',
      roles: [{ id: 'role-id', name: 'Guitarra', status: 'active' }],
    });
    const { container, findByRole, getByText, queryByText } = renderView();

    expect(await findByRole('heading', { name: 'Louvor' })).toBeVisible();
    expect(getByText('Guitarra')).toBeVisible();
    expect(queryByText('Liderança')).not.toBeInTheDocument();
    expect(requests.get).toHaveBeenCalledWith(
      '/bff/organizations/organization-id/ministries/ministry-id',
      expect.any(AbortSignal),
    );
    const accessibility = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(accessibility.violations).toEqual([]);
  });

  it('explains when no ministry function has been defined', async () => {
    requests.get.mockResolvedValue({
      id: 'ministry-id',
      name: 'Recepção',
      status: 'active',
      roles: [],
    });
    const { findByText } = renderView();

    expect(await findByText('Nenhuma função ministerial foi definida ainda.')).toBeVisible();
  });
});
