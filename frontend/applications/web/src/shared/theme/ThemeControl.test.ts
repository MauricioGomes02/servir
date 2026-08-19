import { fireEvent, render } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ThemeControl from './ThemeControl.vue';
import { createI18n } from '@/shared/i18n';

function renderThemeControl() {
  return render(ThemeControl, { global: { plugins: [createI18n('pt-BR')] } });
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: false })),
  );
});

describe('ThemeControl', () => {
  it('keeps appearance settings behind a compact configuration button', async () => {
    const view = renderThemeControl();
    expect(view.queryByRole('dialog', { name: 'Configurações' })).not.toBeInTheDocument();

    await fireEvent.click(view.getByRole('button', { name: 'Abrir configurações' }));

    expect(view.getByRole('dialog', { name: 'Configurações' })).toBeVisible();
    expect(view.getByRole('button', { name: 'Abrir configurações' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(view.getByRole('button', { name: 'Abrir configurações' })).toHaveAttribute(
      'aria-controls',
      'appearance-settings',
    );
    expect(view.getByRole('radio', { name: 'Usar tema do sistema' })).toBeChecked();
    expect(view.getByRole('radio', { name: 'Usar tema do sistema' })).toHaveFocus();
  });

  it('does not duplicate its explicit control with a keyboard shortcut', async () => {
    const view = renderThemeControl();

    await fireEvent.keyDown(document, { key: 'T', altKey: true, shiftKey: true });
    await fireEvent.keyDown(document, { key: '?' });

    expect(view.queryByRole('dialog', { name: 'Configurações' })).not.toBeInTheDocument();
  });

  it('supports arrow navigation after opening through its explicit control', async () => {
    const view = renderThemeControl();
    const trigger = view.getByRole('button', { name: 'Abrir configurações' });

    await fireEvent.click(trigger);

    const systemTheme = view.getByRole('radio', { name: 'Usar tema do sistema' });
    expect(systemTheme).toHaveFocus();

    await fireEvent.keyDown(systemTheme, { key: 'ArrowRight' });
    expect(view.getByRole('radio', { name: 'Tema claro' })).toBeChecked();
    expect(view.getByRole('radio', { name: 'Tema claro' })).toHaveFocus();
    expect(localStorage.getItem('servir.theme')).toBe('light');

    await fireEvent.keyDown(document, { key: 'Escape' });
    expect(view.queryByRole('dialog', { name: 'Configurações' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('persists an explicit dark theme and closes with Escape', async () => {
    const view = renderThemeControl();
    const trigger = view.getByRole('button', { name: 'Abrir configurações' });
    await fireEvent.click(trigger);
    await fireEvent.click(view.getByRole('radio', { name: 'Tema escuro' }));

    expect(localStorage.getItem('servir.theme')).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');

    await fireEvent.keyDown(document, { key: 'Escape' });
    expect(view.queryByRole('dialog', { name: 'Configurações' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
