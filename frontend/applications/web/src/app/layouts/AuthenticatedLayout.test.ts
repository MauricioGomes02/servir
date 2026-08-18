import { fireEvent, render } from '@testing-library/vue';
import { readonly, ref } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { describe, expect, it, vi } from 'vitest';
import { provideSessionStore, type SessionStore } from '@/shared/auth';
import { createI18n } from '@/shared/i18n';
import AuthenticatedLayout from './AuthenticatedLayout.vue';

vi.stubGlobal(
  'matchMedia',
  vi.fn(() => ({ matches: false })),
);

describe('AuthenticatedLayout', () => {
  it('closes settings when navigation changes and keeps organization selection reachable', async () => {
    const session: SessionStore = {
      loading: readonly(ref(false)),
      problem: readonly(ref(false)),
      snapshot: readonly(
        ref({ authenticationEnabled: true, authenticated: true, userId: 'user-id' } as const),
      ),
      clear: vi.fn(),
      load: vi.fn(),
    };
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/',
          component: AuthenticatedLayout,
          children: [
            {
              path: '',
              name: 'accessible-organizations',
              component: { template: '<RouterLink to="/next">Continue</RouterLink>' },
            },
            { path: 'next', component: { template: '<p>Next page</p>' } },
          ],
        },
      ],
    });
    await router.push('/');
    await router.isReady();
    const view = render(
      { template: '<RouterView />' },
      {
        global: {
          plugins: [
            createI18n('pt-BR'),
            { install: (app) => provideSessionStore(app, session) },
            router,
          ],
        },
      },
    );

    expect(view.getByRole('link', { name: 'Ir para minhas igrejas' })).toHaveAttribute('href', '/');
    await fireEvent.click(view.getByRole('button', { name: 'Abrir configurações' }));
    expect(view.getByRole('dialog', { name: 'Configurações' })).toBeVisible();

    await fireEvent.click(view.getByRole('link', { name: 'Continue' }));

    expect(await view.findByText('Next page')).toBeVisible();
    expect(view.queryByRole('dialog', { name: 'Configurações' })).not.toBeInTheDocument();
  });
});
