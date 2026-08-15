import { fireEvent, render } from '@testing-library/vue';
import { axe } from 'vitest-axe';
import { createMemoryHistory, createRouter } from 'vue-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpProblem } from '@/shared/api';
import MinistryDetailsPage from './MinistryDetailsPage.vue';

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
        path: '/organizations/:organizationId/ministries',
        name: 'organization-ministries',
        component: { template: '<p>Ministries</p>' },
      },
      {
        path: '/organizations/:organizationId/ministries/:ministryId',
        component: MinistryDetailsPage,
        props: true,
      },
    ],
  });
  await router.push('/organizations/organization-id/ministries/ministry-id');
  await router.isReady();

  return render(MinistryDetailsPage, {
    props: { organizationId: 'organization-id', ministryId: 'ministry-id' },
    global: { plugins: [router] },
  });
}

describe('MinistryDetailsPage', () => {
  beforeEach(() => {
    requests.get.mockReset();
    requests.post.mockReset();
  });

  it('presents the ministry and its real functions without speculative sections', async () => {
    requests.get.mockResolvedValue({
      id: 'ministry-id',
      name: 'Louvor',
      status: 'active',
      roles: [{ id: 'role-id', name: 'Guitarra', status: 'active' }],
    });
    const { container, findByRole, getByRole, getByText, queryByText } = await renderView();

    expect(await findByRole('heading', { name: 'Louvor' })).toBeVisible();
    const backLink = getByRole('link', { name: 'Voltar para a lista de ministérios' });
    expect(getByRole('navigation', { name: 'Navegação do ministério' })).toContainElement(backLink);
    expect(backLink).toHaveClass('ministry-back-link', 'app-button-secondary');
    expect(backLink).toHaveAttribute('href', '/organizations/organization-id/ministries');
    expect(backLink.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
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
    const { findByText } = await renderView();

    expect(await findByText('Nenhuma função ministerial foi definida ainda.')).toBeVisible();
  });

  it('creates a ministry function and refreshes the visible structure', async () => {
    requests.get
      .mockResolvedValueOnce({ id: 'ministry-id', name: 'Louvor', status: 'active', roles: [] })
      .mockResolvedValueOnce({
        id: 'ministry-id',
        name: 'Louvor',
        status: 'active',
        roles: [{ id: 'role-id', name: 'Guitarra', status: 'active' }],
      });
    requests.post.mockResolvedValue({ id: 'role-id', name: 'Guitarra', status: 'active' });
    const { findByRole, findByText, getByLabelText, getByRole, queryByRole } = await renderView();
    await findByRole('heading', { name: 'Louvor' });

    await fireEvent.click(getByRole('button', { name: 'Adicionar função ministerial' }));
    await fireEvent.update(getByLabelText('Nome da função ministerial'), 'Guitarra');
    await fireEvent.click(getByRole('button', { name: 'Criar função ministerial' }));

    expect(await findByText('Guitarra')).toBeVisible();
    expect(requests.post).toHaveBeenCalledWith(
      '/bff/organizations/organization-id/ministries/ministry-id/roles',
      { name: 'Guitarra' },
      undefined,
    );
    expect(queryByRole('form', { name: 'Criar função ministerial' })).not.toBeInTheDocument();
  });

  it('keeps the role form available when the name is rejected', async () => {
    requests.get.mockResolvedValue({
      id: 'ministry-id',
      name: 'Louvor',
      status: 'active',
      roles: [],
    });
    requests.post.mockRejectedValue(
      new HttpProblem({
        type: '/problems/validation-error',
        title: 'Revise os dados informados.',
        status: 422,
        errors: [
          { code: 'ministry_role.name.empty', detail: 'Informe o nome.', pointer: '#/name' },
        ],
      }),
    );
    const { findByRole, findByText, getByLabelText, getByRole } = await renderView();
    await findByRole('heading', { name: 'Louvor' });

    await fireEvent.click(getByRole('button', { name: 'Adicionar função ministerial' }));
    await fireEvent.update(getByLabelText('Nome da função ministerial'), '');
    await fireEvent.click(getByRole('button', { name: 'Criar função ministerial' }));

    expect(await findByText('Informe o nome.')).toBeVisible();
    expect(getByRole('group', { name: 'Criar função ministerial' })).toBeVisible();
  });
});
