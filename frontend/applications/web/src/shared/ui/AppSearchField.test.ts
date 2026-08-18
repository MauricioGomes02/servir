import { fireEvent, render } from '@testing-library/vue';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import AppSearchField from './AppSearchField.vue';

describe('AppSearchField', () => {
  it('submits with Enter and keeps the visible control compact', async () => {
    const onSearch = vi.fn();
    const view = render(AppSearchField, {
      props: {
        id: 'ministry-search',
        label: 'Buscar ministérios',
        clearLabel: 'Limpar busca',
        modelValue: '',
        'onUpdate:modelValue': () => undefined,
        onSearch,
      },
    });

    await fireEvent.update(view.getByRole('searchbox', { name: 'Buscar ministérios' }), 'louvor');
    await fireEvent.submit(view.getByRole('search'));

    expect(onSearch).toHaveBeenCalledOnce();
    expect(view.queryByRole('button', { name: 'Buscar ministérios' })).not.toBeInTheDocument();
  });

  it('clears the term through an explicitly named control', async () => {
    const onClear = vi.fn();
    const onUpdate = vi.fn();
    const view = render(AppSearchField, {
      props: {
        id: 'ministry-search',
        label: 'Buscar ministérios',
        clearLabel: 'Limpar busca',
        modelValue: 'louvor',
        'onUpdate:modelValue': onUpdate,
        onClear,
      },
    });

    await fireEvent.click(view.getByRole('button', { name: 'Limpar busca' }));

    expect(onUpdate).toHaveBeenCalledWith('');
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = render(AppSearchField, {
      props: {
        id: 'ministry-search',
        label: 'Buscar ministérios',
        clearLabel: 'Limpar busca',
        modelValue: 'louvor',
        'onUpdate:modelValue': () => undefined,
      },
    });

    const accessibility = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(accessibility.violations).toEqual([]);
  });
});
