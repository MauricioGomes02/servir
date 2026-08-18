import { render } from '@testing-library/vue';
import { axe } from 'vitest-axe';
import { createMemoryHistory, createRouter } from 'vue-router';
import { describe, expect, it } from 'vitest';
import CreateOrganizationPage from './CreateOrganizationPage.vue';

describe('CreateOrganizationPage', () => {
  it('provides an accessible organization creation form', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'accessible-organizations', component: { template: '<main />' } },
        { path: '/organizations/new', component: CreateOrganizationPage },
      ],
    });
    await router.push('/organizations/new');
    await router.isReady();
    const { container, getByRole, getByLabelText } = render(CreateOrganizationPage, {
      global: { plugins: [router] },
    });

    expect(
      getByRole('heading', { name: 'Mais tempo para cuidar da sua comunidade.' }),
    ).toBeVisible();
    expect(getByLabelText('Nome da igreja ou comunidade')).toBeRequired();
    expect(getByRole('link', { name: 'Voltar para minhas igrejas' })).toHaveAttribute('href', '/');
    expect(getByRole('button', { name: 'Criar minha igreja' })).toBeVisible();
    const accessibility = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(accessibility.violations).toEqual([]);
  });
});
