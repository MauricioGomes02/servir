import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  DefaultLocale,
  resolveLocale,
  SupportedLocales,
} from '.';

describe('Locale', () => {
  it('resolve locales suportados para a forma canonica', () => {
    assert.equal(resolveLocale(' pt-br '), SupportedLocales.PortugueseBrazil);
    assert.equal(
      resolveLocale('EN-us'),
      SupportedLocales.EnglishUnitedStates,
    );
  });

  it('resolve aliases de idioma para o locale suportado', () => {
    assert.equal(resolveLocale('pt'), SupportedLocales.PortugueseBrazil);
    assert.equal(
      resolveLocale('EN'),
      SupportedLocales.EnglishUnitedStates,
    );
  });

  it('usa o locale padrao quando o valor nao e suportado', () => {
    assert.equal(resolveLocale('es'), DefaultLocale);
    assert.equal(resolveLocale('en-GB'), DefaultLocale);
    assert.equal(resolveLocale(undefined), DefaultLocale);
  });
});
