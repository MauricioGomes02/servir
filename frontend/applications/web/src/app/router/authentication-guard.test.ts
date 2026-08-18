import { readonly, ref } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { describe, expect, it } from 'vitest';
import type { SessionSnapshot, SessionStore } from '@/shared/auth';
import { registerAuthenticationGuard } from './authentication-guard';

const View = { template: '<main />' };

function createSession(snapshot: SessionSnapshot): SessionStore {
  return {
    loading: readonly(ref(false)),
    problem: readonly(ref(false)),
    snapshot: readonly(ref(snapshot)),
    clear() {},
    async load() {
      return snapshot;
    },
  };
}

function createTestRouter(session: SessionStore) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'accessible-organizations', component: View },
      { path: '/sign-in', name: 'sign-in', component: View },
      { path: '/organizations/:organizationId', name: 'organization-home', component: View },
    ],
  });
  registerAuthenticationGuard(router, session);
  return router;
}

describe('authentication guard', () => {
  it('keeps local development available when authentication is disabled', async () => {
    const router = createTestRouter(
      createSession({ authenticationEnabled: false, authenticated: false }),
    );

    await router.push('/organizations/organization-id');

    expect(router.currentRoute.value.name).toBe('organization-home');
  });

  it('sends an anonymous visitor to sign-in with a local return path', async () => {
    const router = createTestRouter(
      createSession({ authenticationEnabled: true, authenticated: false }),
    );

    await router.push('/organizations/organization-id');

    expect(router.currentRoute.value.name).toBe('sign-in');
    expect(router.currentRoute.value.query.returnPath).toBe('/organizations/organization-id');
  });

  it('does not keep an authenticated user on sign-in', async () => {
    const router = createTestRouter(
      createSession({ authenticationEnabled: true, authenticated: true, userId: 'user-id' }),
    );

    await router.push('/sign-in');

    expect(router.currentRoute.value.name).toBe('accessible-organizations');
  });
});
