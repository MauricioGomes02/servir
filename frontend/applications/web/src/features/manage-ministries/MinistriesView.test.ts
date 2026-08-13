import { fireEvent, render } from '@testing-library/vue';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MinistriesView from './MinistriesView.vue';

const services = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
}));

vi.mock('./composition', () => ({ manageMinistries: services }));

const emptyPage = {
  items: [],
  pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
};

describe('MinistriesView', () => {
  beforeEach(() => {
    services.list.mockReset().mockResolvedValue(emptyPage);
    services.create.mockReset();
  });

  it('explains the next action when the organization has no ministries', async () => {
    const { container, findByRole, getByRole } = render(MinistriesView, {
      props: { organizationId: 'organization-id' },
    });

    expect(
      await findByRole('heading', { name: 'Sua estrutura ministerial começa aqui' }),
    ).toBeVisible();
    expect(getByRole('button', { name: 'Criar primeiro ministério' })).toBeVisible();
    expect(services.list).toHaveBeenCalledWith(
      'organization-id',
      { search: undefined, status: 'active', pageSize: 20 },
      expect.any(AbortSignal),
    );
    const accessibility = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(accessibility.violations).toEqual([]);
  });

  it('distinguishes an empty search from an organization without ministries', async () => {
    const { findByRole, getByLabelText, getByRole } = render(MinistriesView, {
      props: { organizationId: 'organization-id' },
    });
    await findByRole('heading', { name: 'Sua estrutura ministerial começa aqui' });

    await fireEvent.update(getByLabelText('Buscar ministérios'), 'Música');
    await fireEvent.click(getByRole('button', { name: 'Buscar' }));

    expect(await findByRole('heading', { name: 'Nenhum ministério encontrado' })).toBeVisible();
    expect(getByRole('button', { name: 'Limpar busca' })).toBeVisible();
  });

  it('creates a ministry and refreshes the visible structure', async () => {
    services.create.mockResolvedValue({ id: 'ministry-id', name: 'Música', status: 'active' });
    services.list.mockResolvedValueOnce(emptyPage).mockResolvedValueOnce({
      items: [{ id: 'ministry-id', name: 'Música', status: 'active' }],
      pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
    });
    const { findByRole, getByLabelText, getByRole, getByText } = render(MinistriesView, {
      props: { organizationId: 'organization-id' },
    });
    await findByRole('heading', { name: 'Sua estrutura ministerial começa aqui' });

    await fireEvent.click(getByRole('button', { name: 'Criar primeiro ministério' }));
    await fireEvent.update(getByLabelText('Nome do ministério'), 'Música');
    await fireEvent.click(getByRole('button', { name: 'Criar ministério' }));

    expect(await findByRole('heading', { name: '1 ministério ativo' })).toBeVisible();
    expect(getByText('Música')).toBeVisible();
    expect(services.create).toHaveBeenCalledWith('organization-id', 'Música');
  });
});
