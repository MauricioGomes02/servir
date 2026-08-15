import { render } from '@testing-library/vue';
import { axe } from 'vitest-axe';
import { createMemoryHistory, createRouter } from 'vue-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MemberDetailsPage from './MemberDetailsPage.vue';

const requests = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal()),
  httpClient: requests,
}));

async function renderView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/organizations/:organizationId/members',
        name: 'organization-members',
        component: { template: '<p>Members</p>' },
      },
      {
        path: '/organizations/:organizationId/members/:memberId',
        component: MemberDetailsPage,
        props: true,
      },
    ],
  });
  await router.push('/organizations/organization-id/members/member-id');
  await router.isReady();
  return render(MemberDetailsPage, {
    props: { organizationId: 'organization-id', memberId: 'member-id' },
    global: { plugins: [router] },
  });
}

describe('MemberDetailsPage', () => {
  beforeEach(() => requests.get.mockReset());

  it('presents the member identity without speculative profile data', async () => {
    requests.get.mockResolvedValue({
      id: 'member-id',
      organizationId: 'organization-id',
      name: 'Maria da Silva',
      status: 'active',
    });
    const { container, findByRole, getByRole, queryByText } = await renderView();

    expect(await findByRole('heading', { name: 'Maria da Silva' })).toBeVisible();
    expect(getByRole('link', { name: 'Voltar para a lista de membros' })).toHaveAttribute(
      'href',
      '/organizations/organization-id/members',
    );
    expect(getByRole('navigation', { name: 'Navegação do membro' })).toBeVisible();
    expect(queryByText('E-mail')).not.toBeInTheDocument();
    expect(queryByText('Permissões')).not.toBeInTheDocument();
    expect(requests.get).toHaveBeenCalledWith(
      '/bff/organizations/organization-id/members/member-id',
      expect.any(AbortSignal),
    );
    const accessibility = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(accessibility.violations).toEqual([]);
  });
});
