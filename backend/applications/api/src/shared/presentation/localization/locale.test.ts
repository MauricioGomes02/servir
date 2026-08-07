import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DefaultLocale, resolveLocale, resolveLocaleCandidates, SupportedLocales } from '.';

describe('Locale', () => {
  it('resolves supported locales to their canonical form', () => {
    assert.equal(resolveLocale(' pt-br '), SupportedLocales.PortugueseBrazil);
    assert.equal(resolveLocale('EN-us'), SupportedLocales.EnglishUnitedStates);
  });

  it('resolves language aliases to the supported locale', () => {
    assert.equal(resolveLocale('pt'), SupportedLocales.PortugueseBrazil);
    assert.equal(resolveLocale('EN'), SupportedLocales.EnglishUnitedStates);
  });

  it('uses the default locale when the value is unsupported', () => {
    assert.equal(resolveLocale('es'), DefaultLocale);
    assert.equal(resolveLocale('en-GB'), DefaultLocale);
    assert.equal(resolveLocale(undefined), DefaultLocale);
  });

  it('selects the first supported candidate without approximating regions', () => {
    assert.equal(resolveLocaleCandidates(['es', 'en']), SupportedLocales.EnglishUnitedStates);
    assert.equal(resolveLocaleCandidates(['en-GB']), DefaultLocale);
  });

  it('skips non-string candidates before selecting a supported locale', () => {
    assert.equal(
      resolveLocaleCandidates([undefined, 123, 'en']),
      SupportedLocales.EnglishUnitedStates,
    );
  });
});
