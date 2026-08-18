import { render } from '@testing-library/vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { describe, expect, it } from 'vitest';
import OrganizationHomePage from './OrganizationHomePage.vue';
import { createI18n } from '@/shared/i18n';

describe('OrganizationHomePage', () => {
  it('presents ministries as a comfortable primary call to action', async () => {
    createI18n('pt-BR');
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

  it('renders the complete page from the selected local catalog', () => {
    createI18n('en-US');

    const { getByRole, getByText } = render(OrganizationHomePage, {
      props: { organizationId: 'organization-id' },
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    });

    expect(getByRole('heading', { name: 'What needs your attention?' })).toBeVisible();
    expect(getByText('View ministries')).toBeVisible();
  });
});
