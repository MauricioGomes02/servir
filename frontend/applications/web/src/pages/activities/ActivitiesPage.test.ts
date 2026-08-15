import { fireEvent, render, waitFor } from '@testing-library/vue';
import { axe } from 'vitest-axe';
import { createMemoryHistory, createRouter } from 'vue-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ActivitiesPage from './ActivitiesPage.vue';

const requests = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal()),
  httpClient: requests,
}));

async function renderPage() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/organizations/:organizationId/activities',
        name: 'organization-activities',
        component: ActivitiesPage,
        props: true,
      },
      {
        path: '/organizations/:organizationId/activities/:activityId',
        name: 'activity-details',
        component: { template: '<p>Activity details</p>' },
      },
    ],
  });
  await router.push('/organizations/organization-id/activities');
  await router.isReady();
  return {
    router,
    ...render(ActivitiesPage, {
      props: { organizationId: 'organization-id' },
      global: { plugins: [router] },
    }),
  };
}

describe('ActivitiesPage', () => {
  beforeEach(() => {
    requests.get.mockReset().mockImplementation((path: string) =>
      Promise.resolve(
        path.includes('/ministries')
          ? {
              items: [{ id: 'ministry-id', name: 'Louvor', status: 'active' }],
              pagination: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
            }
          : {
              items: [],
              pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
            },
      ),
    );
    requests.post.mockReset();
  });

  it('explains the next useful step without simulating occurrences', async () => {
    const { container, findByRole, getByRole, queryByText } = await renderPage();
    expect(
      await findByRole('heading', { name: 'Comece pela próxima atividade da comunidade' }),
    ).toBeVisible();
    expect(getByRole('button', { name: 'Planejar primeira atividade' })).toBeEnabled();
    expect(queryByText('Calendário')).not.toBeInTheDocument();
    const accessibility = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(accessibility.violations).toEqual([]);
  });

  it('creates an activity with selected ministries and opens its confirmed details', async () => {
    requests.post.mockResolvedValue({ id: 'activity-id', name: 'Culto', status: 'active' });
    const { findByRole, getByLabelText, getByRole, router } = await renderPage();
    await findByRole('heading', { name: 'Comece pela próxima atividade da comunidade' });

    await fireEvent.click(getByRole('button', { name: 'Planejar nova atividade' }));
    await fireEvent.update(getByLabelText('Nome da atividade'), 'Culto');
    await fireEvent.click(getByLabelText('Louvor'));
    await fireEvent.click(getByRole('button', { name: 'Criar atividade' }));

    await waitFor(() => expect(router.currentRoute.value.name).toBe('activity-details'));
    expect(requests.post).toHaveBeenCalledWith(
      '/bff/organizations/organization-id/activities',
      { name: 'Culto', ministryIds: ['ministry-id'] },
      undefined,
    );
  });
});
