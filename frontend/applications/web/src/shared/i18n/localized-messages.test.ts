import { describe, expect, it } from 'vitest';
import { createI18n } from './i18n';
import { defineLocalizedMessages, useLocalizedMessages } from './localized-messages';

const messages = defineLocalizedMessages({
  'pt-BR': { title: 'Ministérios' },
  'en-US': { title: 'Ministries' },
});

describe('localized messages', () => {
  it('keeps a local catalog reactive to the application locale', () => {
    const { i18n } = createI18n('pt-BR');
    const local = useLocalizedMessages(messages);
    expect(local.t('title')).toBe('Ministérios');

    i18n.setLocale('en-US');

    expect(local.t('title')).toBe('Ministries');
  });
});
