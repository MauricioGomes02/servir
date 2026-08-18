import { render } from '@testing-library/vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { describe, expect, it } from 'vitest';
import App from './App.vue';
import { createSessionProvider } from '@/app/providers';
import { createSessionStore } from '@/shared/auth';
import { createI18n } from '@/shared/i18n';

const EmptyView = { template: '<p>Conteúdo</p>' };

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/organizations/new', name: 'create-organization', component: EmptyView },
      { path: '/organizations/:organizationId', name: 'organization-home', component: EmptyView },
      {
        path: '/organizations/:organizationId/ministries',
        name: 'organization-ministries',
        component: EmptyView,
      },
    ],
  });
}

function appPlugins(router: ReturnType<typeof createTestRouter>) {
  return [createI18n('pt-BR'), createSessionProvider(createSessionStore()), router];
}

describe('App navigation', () => {
  it('presents a static brand when it cannot produce navigation', async () => {
    const router = createTestRouter();
    await router.push('/organizations/organization-id');
    await router.isReady();
    const { getByLabelText, queryByRole } = render(App, {
      global: { plugins: appPlugins(router) },
    });

    expect(getByLabelText('Servir').tagName).toBe('SPAN');
    expect(
      queryByRole('link', { name: 'Ir para o início da organização' }),
    ).not.toBeInTheDocument();
  });

  it('offers an explicit home link from an internal organization page', async () => {
    const router = createTestRouter();
    await router.push('/organizations/organization-id/ministries');
    await router.isReady();
    const { getByRole } = render(App, { global: { plugins: appPlugins(router) } });

    expect(getByRole('link', { name: 'Ir para o início da organização' })).toHaveAttribute(
      'href',
      '/organizations/organization-id',
    );
  });
});
