import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  SupportedLocales,
  type MessageCatalog,
} from '@/shared/presentation/localization';

import { InMemoryMessageTranslator } from '.';

const catalog: MessageCatalog = {
  'pt-BR': {
    'organization.name.too_long': 'Use no maximo {maxLength} caracteres.',
  },
  'en-US': {
    'organization.name.too_long': 'Use at most {maxLength} characters.',
  },
};

describe('InMemoryMessageTranslator', () => {
  it('translates by code and interpolates parameters', () => {
    const translator = new InMemoryMessageTranslator(catalog);

    assert.equal(
      translator.translate({
        code: 'organization.name.too_long',
        locale: SupportedLocales.EnglishUnitedStates,
        parameters: { maxLength: 120 },
      }),
      'Use at most 120 characters.',
    );
  });

  it('returns a safe message when the code has no translation', () => {
    const translator = new InMemoryMessageTranslator(catalog);

    assert.equal(
      translator.translate({
        code: 'unknown.error',
        locale: SupportedLocales.PortugueseBrazil,
      }),
      'Nao foi possivel processar a solicitacao.',
    );
  });

  it('protects the catalog from external mutation', () => {
    const mutableCatalog = {
      'pt-BR': { greeting: 'Ola' },
      'en-US': { greeting: 'Hello' },
    };
    const translator = new InMemoryMessageTranslator(mutableCatalog);

    mutableCatalog['en-US'].greeting = 'Changed';

    assert.equal(
      translator.translate({
        code: 'greeting',
        locale: SupportedLocales.EnglishUnitedStates,
      }),
      'Hello',
    );
  });
});
