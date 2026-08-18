import { render } from '@testing-library/vue';
import { axe } from 'vitest-axe';
import { createMemoryHistory, createRouter } from 'vue-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AccessibleOrganizationsPage from './AccessibleOrganizationsPage.vue';

const requests = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal()),
  httpClient: requests,
}));

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'accessible-organizations', component: AccessibleOrganizationsPage },
      {
        path: '/organizations/new',
        name: 'create-organization',
        component: { template: '<p>Create organization</p>' },
      },
      {
        path: '/organizations/:organizationId',
        name: 'organization-home',
        component: { template: '<p>Organization home</p>' },
      },
    ],
  });
}

describe('AccessibleOrganizationsPage', () => {
  beforeEach(() => requests.get.mockReset());

  it('presents every accessible church as an explicit action', async () => {
    requests.get.mockResolvedValue({
      items: [
        { id: 'first-id', name: 'Comunidade Servir' },
        { id: 'second-id', name: 'Igreja Esperança' },
      ],
    });
    const router = createTestRouter();
    await router.push('/');
    await router.isReady();

    const { container, findByRole, getByRole } = render(AccessibleOrganizationsPage, {
      global: { plugins: [router] },
    });

    expect(await findByRole('link', { name: /Comunidade Servir/ })).toHaveAttribute(
      'href',
      '/organizations/first-id',
    );
    expect(getByRole('link', { name: /Igreja Esperança/ })).toHaveAttribute(
      'href',
      '/organizations/second-id',
    );
    expect(requests.get).toHaveBeenCalledWith('/bff/organizations', expect.any(AbortSignal));
    expect(
      (await axe(container, { rules: { 'color-contrast': { enabled: false } } })).violations,
    ).toEqual([]);
  });

  it('explains how to continue when the user has no accessible church', async () => {
    requests.get.mockResolvedValue({ items: [] });
    const router = createTestRouter();
    await router.push('/');
    await router.isReady();

    const { findByRole } = render(AccessibleOrganizationsPage, {
      global: { plugins: [router] },
    });

    expect(await findByRole('heading', { name: /ainda não participa/ })).toBeVisible();
    expect(await findByRole('link', { name: /Criar o espaço/ })).toHaveAttribute(
      'href',
      '/organizations/new',
    );
  });

  it('keeps creation and organization choice available when only one church is accessible', async () => {
    requests.get.mockResolvedValue({
      items: [{ id: 'only-id', name: 'Comunidade Servir' }],
    });
    const router = createTestRouter();
    await router.push('/');
    await router.isReady();

    const view = render(AccessibleOrganizationsPage, { global: { plugins: [router] } });

    expect(await view.findByRole('link', { name: /Comunidade Servir/ })).toBeVisible();
    expect(view.getByRole('link', { name: 'Cadastrar outra igreja' })).toHaveAttribute(
      'href',
      '/organizations/new',
    );
    expect(router.currentRoute.value.name).toBe('accessible-organizations');
  });
});
