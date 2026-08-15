import { render } from '@testing-library/vue';
import { axe } from 'vitest-axe';
import { createMemoryHistory, createRouter } from 'vue-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OrganizationLayout from './OrganizationLayout.vue';

const requests = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal()),
  httpClient: requests,
}));

describe('OrganizationLayout', () => {
  beforeEach(() => {
    requests.get.mockReset().mockResolvedValue({
      id: 'organization-id',
      name: 'Comunidade Evangélica Servir e Transformar do Bairro Primavera',
    });
  });

  it('keeps organization context and current navigation accessible', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/organizations/:organizationId',
          component: OrganizationLayout,
          props: true,
          children: [
            {
              path: '',
              name: 'organization-home',
              component: { template: '<p>Home</p>' },
            },
            {
              path: 'ministries',
              name: 'organization-ministries',
              component: { template: '<p>Ministries</p>' },
            },
            {
              path: 'members',
              name: 'organization-members',
              component: { template: '<p>Members</p>' },
            },
            {
              path: 'activities',
              name: 'organization-activities',
              component: { template: '<p>Activities</p>' },
            },
          ],
        },
      ],
    });
    await router.push('/organizations/organization-id');
    await router.isReady();

    const { container, findByText, getByRole } = render(
      { template: '<RouterView />' },
      { global: { plugins: [router] } },
    );

    expect(
      await findByText('Comunidade Evangélica Servir e Transformar do Bairro Primavera'),
    ).toBeVisible();
    const navigation = getByRole('navigation', { name: 'Navegação da organização' });
    expect(getByRole('link', { name: 'Início' })).toHaveClass('is-active');
    expect(getByRole('link', { name: 'Ministérios' })).not.toHaveClass('is-active');
    expect(getByRole('link', { name: 'Membros' })).not.toHaveClass('is-active');
    expect(getByRole('link', { name: 'Atividades' })).not.toHaveClass('is-active');
    expect(requests.get).toHaveBeenCalledWith(
      '/bff/organizations/organization-id',
      expect.any(AbortSignal),
    );
    const accessibility = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(navigation).toBeVisible();
    expect(accessibility.violations).toEqual([]);
  });
});
