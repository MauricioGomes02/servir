import type { App } from 'vue';
import { provideSessionStore, type SessionStore } from '@/shared/auth';

export function createSessionProvider(store: SessionStore) {
  return {
    install(app: App) {
      provideSessionStore(app, store);
    },
  };
}
