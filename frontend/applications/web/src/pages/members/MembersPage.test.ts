import { fireEvent, render, waitFor } from '@testing-library/vue';
import { axe } from 'vitest-axe';
import { createMemoryHistory, createRouter } from 'vue-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpProblem } from '@/shared/api';
import MembersPage from './MembersPage.vue';

const requests = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal()),
  httpClient: requests,
}));

const emptyPage = {
  items: [],
  pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
};

async function renderPage(path = '/organizations/organization-id/members') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/organizations/:organizationId/members',
        name: 'organization-members',
        component: MembersPage,
        props: true,
      },
      {
        path: '/organizations/:organizationId/members/:memberId',
        name: 'member-details',
        component: { template: '<p>Member details</p>' },
      },
    ],
  });
  await router.push(path);
  await router.isReady();
  return {
    router,
    ...render(MembersPage, {
      props: { organizationId: 'organization-id' },
      global: { plugins: [router] },
    }),
  };
}

describe('MembersPage', () => {
  beforeEach(() => {
    requests.get.mockReset().mockResolvedValue(emptyPage);
    requests.post.mockReset();
  });

  it('explains how to start the member community', async () => {
    const { container, findByRole, getByRole } = await renderPage();

    expect(
      await findByRole('heading', { name: 'A comunidade começa com seus membros' }),
    ).toBeVisible();
    expect(getByRole('button', { name: 'Cadastrar primeiro membro' })).toBeVisible();
    expect(requests.get).toHaveBeenCalledWith(
      '/bff/organizations/organization-id/members?page=1&pageSize=20&status=active',
      expect.any(AbortSignal),
    );
    const accessibility = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(accessibility.violations).toEqual([]);
  });

  it('makes each member an explicit profile link', async () => {
    requests.get.mockResolvedValue({
      items: [{ id: 'member-id', name: 'Maria da Silva', status: 'active' }],
      pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
    });
    const { findByRole } = await renderPage();

    const profile = await findByRole('link', { name: 'Ver perfil do membro Maria da Silva' });
    expect(profile).toHaveAttribute('href', '/organizations/organization-id/members/member-id');
    expect(profile).toHaveTextContent('Ver perfil');
    profile.focus();
    expect(profile).toHaveFocus();
  });

  it('preserves member search and pagination in the URL', async () => {
    requests.get
      .mockResolvedValueOnce({
        items: [{ id: 'member-1', name: 'Maria', status: 'active' }],
        pagination: { page: 1, pageSize: 20, totalItems: 21, totalPages: 2 },
      })
      .mockResolvedValueOnce({
        items: [{ id: 'member-21', name: 'Mariana', status: 'active' }],
        pagination: { page: 2, pageSize: 20, totalItems: 21, totalPages: 2 },
      })
      .mockResolvedValueOnce({
        items: [],
        pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
      });
    const { findByRole, getByLabelText, getByRole, router } = await renderPage();
    await findByRole('link', { name: 'Ver perfil do membro Maria' });

    await fireEvent.click(getByRole('button', { name: 'Próxima página' }));
    await waitFor(() => expect(router.currentRoute.value.query.page).toBe('2'));
    expect(requests.get).toHaveBeenLastCalledWith(
      '/bff/organizations/organization-id/members?page=2&pageSize=20&status=active',
      expect.any(AbortSignal),
    );

    await fireEvent.update(getByLabelText('Buscar membros'), 'Ana');
    await fireEvent.click(getByRole('button', { name: 'Buscar membros' }));
    await waitFor(() => expect(router.currentRoute.value.query.search).toBe('Ana'));
    expect(router.currentRoute.value.query.page).toBeUndefined();
    expect(requests.get).toHaveBeenLastCalledWith(
      '/bff/organizations/organization-id/members?page=1&pageSize=20&search=Ana&status=active',
      expect.any(AbortSignal),
    );
  });

  it('navigates to the profile confirmed by member registration', async () => {
    requests.post.mockResolvedValue({
      id: 'new-member-id',
      organizationId: 'organization-id',
      name: 'João',
    });
    const { findByRole, getByLabelText, getByRole, router } = await renderPage();
    await findByRole('heading', { name: 'A comunidade começa com seus membros' });

    await fireEvent.click(getByRole('button', { name: 'Cadastrar novo membro' }));
    await fireEvent.update(getByLabelText('Nome do membro'), 'João');
    await fireEvent.click(getByRole('button', { name: 'Cadastrar membro' }));

    await waitFor(() => expect(router.currentRoute.value.name).toBe('member-details'));
    expect(router.currentRoute.value.params.memberId).toBe('new-member-id');
    expect(requests.post).toHaveBeenCalledWith(
      '/bff/organizations/organization-id/members',
      { name: 'João' },
      undefined,
    );
  });

  it('keeps member registration available when the name is rejected', async () => {
    requests.post.mockRejectedValue(
      new HttpProblem({
        type: '/problems/validation-error',
        title: 'Revise os dados informados.',
        status: 422,
        errors: [{ code: 'member.name.empty', detail: 'Informe o nome.', pointer: '#/name' }],
      }),
    );
    const { findByRole, findByText, getByRole } = await renderPage();
    await findByRole('heading', { name: 'A comunidade começa com seus membros' });

    await fireEvent.click(getByRole('button', { name: 'Cadastrar novo membro' }));
    await fireEvent.click(getByRole('button', { name: 'Cadastrar membro' }));

    expect(await findByText('Informe o nome.')).toBeVisible();
    expect(getByRole('group', { name: 'Cadastrar novo membro' })).toBeVisible();
  });
});
