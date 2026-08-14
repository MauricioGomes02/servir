import { fireEvent, render } from '@testing-library/vue';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import AppButton from './AppButton.vue';

describe('AppButton', () => {
  it('uses native button semantics and defaults to the primary medium action', async () => {
    const onClick = vi.fn();
    const view = render(AppButton, {
      slots: { default: 'Salvar alterações' },
      attrs: { onClick },
    });
    const button = view.getByRole('button', { name: 'Salvar alterações' });

    await fireEvent.click(button);

    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('app-button-primary', 'app-button-medium');
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('preserves the action label and prevents duplication while loading', async () => {
    const onClick = vi.fn();
    const view = render(AppButton, {
      props: { loading: true },
      slots: { default: 'Criar ministério' },
      attrs: { onClick },
    });
    const button = view.getByRole('button', { name: 'Criar ministério, em andamento' });

    await fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(view.getByText('Criar ministério')).toBeVisible();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('expresses variant, size, disabled, and full-width states through one contract', () => {
    const view = render(AppButton, {
      props: { variant: 'destructive', size: 'large', disabled: true, fullWidth: true },
      slots: { default: 'Excluir atividade' },
    });
    const button = view.getByRole('button', { name: 'Excluir atividade' });

    expect(button).toBeDisabled();
    expect(button).toHaveClass(
      'app-button-destructive',
      'app-button-large',
      'app-button-full-width',
    );
  });

  it('has no detectable accessibility violations in a critical loading state', async () => {
    const { container } = render(AppButton, {
      props: { loading: true },
      slots: { default: 'Salvar alterações' },
    });

    const accessibility = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(accessibility.violations).toEqual([]);
  });
});
