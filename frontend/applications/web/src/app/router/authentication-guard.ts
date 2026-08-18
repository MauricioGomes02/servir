import type { Router } from 'vue-router';
import type { SessionStore } from '@/shared/auth';

export function registerAuthenticationGuard(router: Router, session: SessionStore): void {
  router.beforeEach(async (to) => {
    const snapshot = await session.load();
    if (snapshot === undefined || !snapshot.authenticationEnabled) return true;
    if (snapshot.authenticated) {
      return to.name === 'sign-in' ? { name: 'accessible-organizations' } : true;
    }
    if (to.name === 'sign-in') return true;
    return { name: 'sign-in', query: { returnPath: to.fullPath } };
  });
}
