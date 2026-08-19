import { fireEvent, render } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';
import { createI18n } from '@/shared/i18n';
import KeyboardHelp from './KeyboardHelp.vue';

describe('KeyboardHelp', () => {
  it('opens with question mark and restores focus when closed', async () => {
    const view = render(KeyboardHelp, { global: { plugins: [createI18n('pt-BR')] } });
    const trigger = view.getByRole('button', { name: 'Abrir ajuda de teclado' });
    expect(trigger).not.toHaveAttribute('aria-keyshortcuts');

    await fireEvent.keyDown(document, { key: '?' });

    expect(view.getByRole('dialog', { name: 'Navegação por teclado' })).toBeVisible();
    expect(view.getByText('Ativar o controle em foco')).toBeVisible();

    await fireEvent.keyDown(document, { key: 'Escape' });
    expect(view.queryByRole('dialog', { name: 'Navegação por teclado' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('does not open from an editable control', async () => {
    const view = render(
      { components: { KeyboardHelp }, template: '<input aria-label="Nome" /><KeyboardHelp />' },
      { global: { plugins: [createI18n('pt-BR')] } },
    );
    const input = view.getByRole('textbox', { name: 'Nome' });
    input.focus();

    await fireEvent.keyDown(input, { key: '?' });

    expect(view.queryByRole('dialog', { name: 'Navegação por teclado' })).not.toBeInTheDocument();
  });
});
