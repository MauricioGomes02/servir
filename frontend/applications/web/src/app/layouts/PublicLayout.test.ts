import { render } from '@testing-library/vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { describe, expect, it } from 'vitest';
import PublicLayout from './PublicLayout.vue';

describe('PublicLayout', () => {
  it('presents authentication outside the authenticated application header', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/sign-in',
          component: PublicLayout,
          children: [{ path: '', component: { template: '<h1>Sign in</h1>' } }],
        },
      ],
    });
    await router.push('/sign-in');
    await router.isReady();

    const view = render({ template: '<RouterView />' }, { global: { plugins: [router] } });

    expect(view.getByRole('main')).toHaveClass('public-layout');
    expect(view.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    expect(view.queryByRole('banner')).not.toBeInTheDocument();
  });
});
