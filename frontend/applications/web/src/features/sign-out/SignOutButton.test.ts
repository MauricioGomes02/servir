import { fireEvent, render, waitFor } from '@testing-library/vue';
import { readonly, ref } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { provideSessionStore, type SessionStore } from '@/shared/auth';
import { createI18n } from '@/shared/i18n';
import SignOutButton from './SignOutButton.vue';

const signOutMock = vi.hoisted(() => vi.fn());
vi.mock('./sign-out', () => ({ signOut: signOutMock }));

function fixture() {
  const clear = vi.fn();
  const store: SessionStore = {
    loading: readonly(ref(false)),
    problem: readonly(ref(false)),
    snapshot: readonly(
      ref({ authenticationEnabled: true, authenticated: true, userId: 'user-id' } as const),
    ),
    clear,
    load: vi.fn(),
  };
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<main />' } },
      { path: '/sign-in', name: 'sign-in', component: { template: '<main />' } },
    ],
  });
  return { clear, router, store };
}

beforeEach(() => {
  signOutMock.mockReset();
});

describe('SignOutButton', () => {
  it('clears the local session and navigates only after logout succeeds', async () => {
    const { clear, router, store } = fixture();
    signOutMock.mockResolvedValue(undefined);
    await router.push('/');
    await router.isReady();
    const view = render(SignOutButton, {
      global: {
        plugins: [
          createI18n('pt-BR'),
          { install: (app) => provideSessionStore(app, store) },
          router,
        ],
      },
    });

    await fireEvent.click(view.getByRole('button', { name: 'Sair da minha conta' }));

    await waitFor(() => expect(router.currentRoute.value.name).toBe('sign-in'));
    expect(clear).toHaveBeenCalledOnce();
  });

  it('keeps the session and explains when logout fails', async () => {
    const { clear, router, store } = fixture();
    signOutMock.mockRejectedValue(new Error('request failed'));
    await router.push('/');
    await router.isReady();
    const view = render(SignOutButton, {
      global: {
        plugins: [
          createI18n('pt-BR'),
          { install: (app) => provideSessionStore(app, store) },
          router,
        ],
      },
    });

    await fireEvent.click(view.getByRole('button', { name: 'Sair da minha conta' }));

    expect(await view.findByRole('alert')).toHaveTextContent(
      'Não foi possível sair. Tente novamente.',
    );
    expect(clear).not.toHaveBeenCalled();
    expect(router.currentRoute.value.name).toBe('home');
  });
});
