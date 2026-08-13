import { render } from '@testing-library/vue';
import { RouterLinkStub } from '@vue/test-utils';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MinistryDetailsView from './MinistryDetailsView.vue';

const services = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('./composition', () => ({ manageMinistries: services }));

function renderView() {
  return render(MinistryDetailsView, {
    props: { organizationId: 'organization-id', ministryId: 'ministry-id' },
    global: { stubs: { RouterLink: RouterLinkStub } },
  });
}

describe('MinistryDetailsView', () => {
  beforeEach(() => services.get.mockReset());

  it('presents the ministry and its real functions without speculative sections', async () => {
    services.get.mockResolvedValue({
      id: 'ministry-id',
      name: 'Louvor',
      status: 'active',
      roles: [{ id: 'role-id', name: 'Guitarra', status: 'active' }],
    });
    const { container, findByRole, getByText, queryByText } = renderView();

    expect(await findByRole('heading', { name: 'Louvor' })).toBeVisible();
    expect(getByText('Guitarra')).toBeVisible();
    expect(queryByText('Liderança')).not.toBeInTheDocument();
    expect(services.get).toHaveBeenCalledWith(
      'organization-id',
      'ministry-id',
      expect.any(AbortSignal),
    );
    const accessibility = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(accessibility.violations).toEqual([]);
  });

  it('explains when no ministry function has been defined', async () => {
    services.get.mockResolvedValue({
      id: 'ministry-id',
      name: 'Recepção',
      status: 'active',
      roles: [],
    });
    const { findByText } = renderView();

    expect(await findByText('Nenhuma função ministerial foi definida ainda.')).toBeVisible();
  });
});
