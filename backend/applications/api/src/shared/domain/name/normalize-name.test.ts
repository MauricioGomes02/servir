import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeName } from './normalize-name';

describe('normalizeName', () => {
  it('normalizes Unicode and whitespace without changing case or removing accents', () => {
    assert.equal(normalizeName('  Ministe\u0301rio\t  Ágape  '), 'Ministério Ágape');
  });
});
