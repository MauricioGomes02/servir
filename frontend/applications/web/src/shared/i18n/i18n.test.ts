import { describe, expect, it } from 'vitest';
import { createI18n } from './i18n';

describe('i18n', () => {
  it('translates typed messages and updates the document language', () => {
    const { i18n } = createI18n('pt-BR');
    expect(i18n.t('settings.title')).toBe('Configurações');

    i18n.setLocale('en-US');

    expect(i18n.t('settings.title')).toBe('Settings');
    expect(document.documentElement.lang).toBe('en-US');
    expect(localStorage.getItem('servir.locale')).toBe('en-US');
  });
});
