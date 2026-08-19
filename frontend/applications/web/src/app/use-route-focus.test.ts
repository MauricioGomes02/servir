import { nextTick, ref } from 'vue';
import { defineComponent } from 'vue';
import { render } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';
import type { RouteLocationNormalizedLoaded } from 'vue-router';
import { useRouteFocus } from './use-route-focus';

describe('useRouteFocus', () => {
  it('moves focus to main content after a path change', async () => {
    const route = ref({ path: '/organizations/one/ministries' } as RouteLocationNormalizedLoaded);
    const view = render(
      defineComponent({
        setup() {
          useRouteFocus(route);
          return { route };
        },
        template: '<main id="main-content" tabindex="-1">Content</main>',
      }),
    );

    route.value = { ...route.value, path: '/organizations/one/members' };
    await nextTick();
    await nextTick();

    expect(view.getByRole('main')).toHaveFocus();
  });
});
