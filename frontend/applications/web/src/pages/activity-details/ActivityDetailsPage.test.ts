import { render } from '@testing-library/vue';
import { axe } from 'vitest-axe';
import { createMemoryHistory, createRouter } from 'vue-router';
import { describe, expect, it, vi } from 'vitest';
import ActivityDetailsPage from './ActivityDetailsPage.vue';

const requests = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal()),
  httpClient: requests,
}));

describe('ActivityDetailsPage', () => {
  it('presents real participating ministries without speculative scheduling data', async () => {
    requests.get.mockResolvedValue({
      id: 'activity-id',
      name: 'Culto de domingo',
      status: 'active',
      ministries: [{ id: 'ministry-id', name: 'Louvor' }],
    });
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/organizations/:organizationId/activities',
          name: 'organization-activities',
          component: { template: '<p>Activities</p>' },
        },
        {
          path: '/organizations/:organizationId/ministries/:ministryId',
          name: 'ministry-details',
          component: { template: '<p>Ministry</p>' },
        },
        {
          path: '/organizations/:organizationId/activities/:activityId',
          component: ActivityDetailsPage,
          props: true,
        },
      ],
    });
    await router.push('/organizations/organization-id/activities/activity-id');
    await router.isReady();
    const { container, findByRole, getByRole, queryByText } = render(ActivityDetailsPage, {
      props: { organizationId: 'organization-id', activityId: 'activity-id' },
      global: { plugins: [router] },
    });
    expect(await findByRole('heading', { name: 'Culto de domingo' })).toBeVisible();
    expect(getByRole('link', { name: /Louvor/ })).toHaveAttribute(
      'href',
      '/organizations/organization-id/ministries/ministry-id',
    );
    expect(queryByText('Disponibilidade')).not.toBeInTheDocument();
    expect(
      (await axe(container, { rules: { 'color-contrast': { enabled: false } } })).violations,
    ).toEqual([]);
  });
});
