import { nextTick, watch, type Ref } from 'vue';
import type { RouteLocationNormalizedLoaded } from 'vue-router';

export function useRouteFocus(route: Ref<RouteLocationNormalizedLoaded>): void {
  watch(
    () => route.value.path,
    async () => {
      await nextTick();
      document.querySelector<HTMLElement>('#main-content')?.focus();
    },
    { flush: 'post' },
  );
}
