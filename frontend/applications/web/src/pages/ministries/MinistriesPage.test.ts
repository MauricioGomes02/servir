import { fireEvent, render } from '@testing-library/vue';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MinistriesPage from './MinistriesPage.vue';

const requests = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal()),
  httpClient: requests,
}));

const emptyPage = {
  items: [],
  pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
};

describe('MinistriesPage', () => {
  beforeEach(() => {
    requests.get.mockReset().mockResolvedValue(emptyPage);
    requests.post.mockReset();
  });

  it('explains the next action when the organization has no ministries', async () => {
    const { container, findByRole, getByRole } = render(MinistriesPage, {
      props: { organizationId: 'organization-id' },
    });

    expect(
      await findByRole('heading', { name: 'Sua estrutura ministerial começa aqui' }),
    ).toBeVisible();
    expect(getByRole('button', { name: 'Criar primeiro ministério' })).toBeVisible();
    expect(requests.get).toHaveBeenCalledWith(
      '/bff/organizations/organization-id/ministries?pageSize=20&status=active',
      expect.any(AbortSignal),
    );
    const accessibility = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(accessibility.violations).toEqual([]);
  });

  it('distinguishes an empty search from an organization without ministries', async () => {
    const { findByRole, getByLabelText, getByRole } = render(MinistriesPage, {
      props: { organizationId: 'organization-id' },
    });
    await findByRole('heading', { name: 'Sua estrutura ministerial começa aqui' });

    await fireEvent.update(getByLabelText('Buscar ministérios'), 'Música');
    await fireEvent.click(getByRole('button', { name: 'Buscar' }));

    expect(await findByRole('heading', { name: 'Nenhum ministério encontrado' })).toBeVisible();
    expect(getByRole('button', { name: 'Limpar busca' })).toBeVisible();
  });

  it('creates a ministry and refreshes the visible structure', async () => {
    requests.post.mockResolvedValue({ id: 'ministry-id', name: 'Música', status: 'active' });
    requests.get.mockResolvedValueOnce(emptyPage).mockResolvedValueOnce({
      items: [{ id: 'ministry-id', name: 'Música', status: 'active' }],
      pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
    });
    const { findByRole, getByLabelText, getByRole, getByText } = render(MinistriesPage, {
      props: { organizationId: 'organization-id' },
    });
    await findByRole('heading', { name: 'Sua estrutura ministerial começa aqui' });

    await fireEvent.click(getByRole('button', { name: 'Criar primeiro ministério' }));
    await fireEvent.update(getByLabelText('Nome do ministério'), 'Música');
    await fireEvent.click(getByRole('button', { name: 'Criar ministério' }));

    expect(await findByRole('heading', { name: '1 ministério ativo' })).toBeVisible();
    expect(getByText('Música')).toBeVisible();
    expect(requests.post).toHaveBeenCalledWith(
      '/bff/organizations/organization-id/ministries',
      { name: 'Música' },
      undefined,
    );
  });
});
