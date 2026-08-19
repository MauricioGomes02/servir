import { render, waitFor } from '@testing-library/vue';
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
          path: '/',
          name: 'accessible-organizations',
          component: { template: '<p>Organizations</p>' },
        },
        {
          path: '/organizations/:organizationId',
          component: OrganizationLayout,
          props: true,
          children: [
            {
              path: '',
              name: 'organization-home',
              meta: { navigationArea: 'home' },
              component: { template: '<p>Home</p>' },
            },
            {
              path: 'ministries',
              name: 'organization-ministries',
              meta: { navigationArea: 'ministries' },
              component: { template: '<p>Ministries</p>' },
            },
            {
              path: 'members',
              name: 'organization-members',
              meta: { navigationArea: 'members' },
              component: { template: '<p>Members</p>' },
            },
            {
              path: 'activities',
              name: 'organization-activities',
              meta: { navigationArea: 'activities' },
              component: { template: '<p>Activities</p>' },
            },
            {
              path: 'ministries/:ministryId',
              name: 'ministry-details',
              meta: { navigationArea: 'ministries' },
              component: { template: '<p>Ministry details</p>' },
            },
            {
              path: 'members/:memberId',
              name: 'member-details',
              meta: { navigationArea: 'members' },
              component: { template: '<p>Member details</p>' },
            },
            {
              path: 'activities/:activityId',
              name: 'activity-details',
              meta: { navigationArea: 'activities' },
              component: { template: '<p>Activity details</p>' },
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
    expect(getByRole('link', { name: 'Trocar de igreja' })).toHaveAttribute('href', '/');
    const navigation = getByRole('navigation', { name: 'Navegação da igreja' });
    expect(navigation).toHaveAttribute('id', 'organization-navigation');
    expect(navigation).not.toHaveAttribute('aria-keyshortcuts');
    expect(getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(getByRole('main')).not.toHaveAttribute('aria-keyshortcuts');
    expect(navigation.closest('main')).toBeNull();
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

    for (const [routeName, parameterName, parameterValue, linkName] of [
      ['ministry-details', 'ministryId', 'ministry-id', /^Minist/],
      ['member-details', 'memberId', 'member-id', /^Membros$/],
      ['activity-details', 'activityId', 'activity-id', /^Atividades$/],
    ] as const) {
      await router.push({
        name: routeName,
        params: { organizationId: 'organization-id', [parameterName]: parameterValue },
      });
      await waitFor(() => expect(router.currentRoute.value.name).toBe(routeName));
      await waitFor(() => expect(getByRole('link', { name: linkName })).toHaveClass('is-active'));
      expect(getByRole('link', { name: linkName })).toHaveAttribute('aria-current', 'page');
    }
  });
});
