import type { App, InjectionKey, Ref } from 'vue';
import { inject, readonly, ref } from 'vue';
import { getSession, type SessionSnapshot } from './session';
import { WebRuntimeError, WebRuntimeErrorCodes } from '@/shared/errors';

export interface SessionStore {
  readonly loading: Readonly<Ref<boolean>>;
  readonly problem: Readonly<Ref<boolean>>;
  readonly snapshot: Readonly<Ref<SessionSnapshot | undefined>>;
  clear(): void;
  load(): Promise<SessionSnapshot | undefined>;
}

const sessionStoreKey: InjectionKey<SessionStore> = Symbol('servir.session-store');

export function createSessionStore(): SessionStore {
  const snapshot = ref<SessionSnapshot>();
  const loading = ref(false);
  const problem = ref(false);
  let pending: Promise<SessionSnapshot | undefined> | undefined;

  async function load(): Promise<SessionSnapshot | undefined> {
    if (snapshot.value !== undefined) return snapshot.value;
    if (pending !== undefined) return pending;
    loading.value = true;
    problem.value = false;
    pending = getSession()
      .then((result) => {
        snapshot.value = result;
        return result;
      })
      .catch(() => {
        problem.value = true;
        return undefined;
      })
      .finally(() => {
        loading.value = false;
        pending = undefined;
      });
    return pending;
  }

  return {
    loading: readonly(loading),
    problem: readonly(problem),
    snapshot: readonly(snapshot),
    clear() {
      snapshot.value = undefined;
    },
    load,
  };
}

export function provideSessionStore(app: App, store: SessionStore): void {
  app.provide(sessionStoreKey, store);
}

export function useSessionStore(): SessionStore {
  const store = inject(sessionStoreKey);
  if (store === undefined) {
    throw new WebRuntimeError(WebRuntimeErrorCodes.SessionProviderUnavailable);
  }
  return store;
}
