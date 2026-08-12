import { render } from '@testing-library/vue';
import { axe } from 'vitest-axe';
import { createMemoryHistory, createRouter } from 'vue-router';
import { describe, expect, it } from 'vitest';
import CreateOrganizationView from './CreateOrganizationView.vue';

describe('CreateOrganizationView', () => {
  it('provides an accessible organization creation form', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: CreateOrganizationView }],
    });
    const { container, getByRole, getByLabelText } = render(CreateOrganizationView, {
      global: { plugins: [router] },
    });

    expect(
      getByRole('heading', { name: 'Organize o cuidado. Simplifique a escala.' }),
    ).toBeVisible();
    expect(getByLabelText('Nome da igreja ou comunidade')).toBeRequired();
    const accessibility = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(accessibility.violations).toEqual([]);
  });
});
