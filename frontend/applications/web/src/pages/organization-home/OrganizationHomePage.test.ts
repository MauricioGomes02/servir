import { render } from '@testing-library/vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { describe, expect, it } from 'vitest';
import OrganizationHomePage from './OrganizationHomePage.vue';

describe('OrganizationHomePage', () => {
  it('presents ministries as a comfortable primary call to action', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/organizations/:organizationId',
          component: OrganizationHomePage,
          props: true,
        },
        {
          path: '/organizations/:organizationId/ministries',
          name: 'organization-ministries',
          component: { template: '<p>Ministries</p>' },
        },
      ],
    });
    await router.push('/organizations/organization-id');
    await router.isReady();

    const { getByRole } = render(OrganizationHomePage, {
      props: { organizationId: 'organization-id' },
      global: { plugins: [router] },
    });

    const callToAction = getByRole('link', { name: 'Ver ministérios' });
    expect(callToAction).toHaveClass('app-button-primary', 'app-button-large');
    expect(callToAction).toHaveAttribute('href', '/organizations/organization-id/ministries');
  });
});
