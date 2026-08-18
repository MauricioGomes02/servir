import { render } from '@testing-library/vue';
import { axe } from 'vitest-axe';
import { createMemoryHistory, createRouter } from 'vue-router';
import { describe, expect, it } from 'vitest';
import NotFoundPage from './NotFoundPage.vue';

describe('NotFoundPage', () => {
  it('explains the missing route and offers a safe continuation', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'accessible-organizations', component: { template: '<main />' } },
        { path: '/:pathMatch(.*)*', component: NotFoundPage },
      ],
    });
    await router.push('/missing-page');
    await router.isReady();

    const view = render(NotFoundPage, { global: { plugins: [router] } });

    expect(view.getByRole('heading', { name: 'Esta página não existe' })).toBeVisible();
    expect(view.getByRole('link', { name: 'Ir para minhas igrejas' })).toHaveAttribute('href', '/');
    expect(
      (await axe(view.container, { rules: { 'color-contrast': { enabled: false } } })).violations,
    ).toEqual([]);
  });
});
