import { render } from '@testing-library/vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { describe, expect, it } from 'vitest';
import App from './App.vue';

describe('App', () => {
  it('delegates the experience shell to the active route layout', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<p>Route layout</p>' } }],
    });
    await router.push('/');
    await router.isReady();

    const view = render(App, { global: { plugins: [router] } });

    expect(view.getByText('Route layout')).toBeVisible();
  });
});
