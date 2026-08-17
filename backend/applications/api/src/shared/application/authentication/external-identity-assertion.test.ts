import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createExternalIdentityAssertion,
  ExternalIdentityAssertionErrorCodes,
  parseIdentityIssuer,
  parseIdentitySubject,
} from '.';

describe('ExternalIdentityAssertion', () => {
  it('preserves provider identifiers without normalization', () => {
    const issuer = parseIdentityIssuer('https://identity.example.com/tenant/');
    const subject = parseIdentitySubject(' Subject-With-Provider-Semantics ');
    assert.equal(issuer.success, true);
    assert.equal(subject.success, true);
    if (!issuer.success || !subject.success) return;

    const assertion = createExternalIdentityAssertion({
      issuer: issuer.value,
      subject: subject.value,
    });

    assert.deepEqual(assertion, {
      issuer: 'https://identity.example.com/tenant/',
      subject: ' Subject-With-Provider-Semantics ',
    });
    assert.equal(Object.isFrozen(assertion), true);
  });

  it('rejects an empty subject', () => {
    assert.deepEqual(parseIdentitySubject(''), {
      success: false,
      error: { code: ExternalIdentityAssertionErrorCodes.Empty, field: 'subject' },
    });
  });

  it('rejects a subject longer than the OIDC limit', () => {
    assert.deepEqual(parseIdentitySubject('a'.repeat(256)), {
      success: false,
      error: {
        code: ExternalIdentityAssertionErrorCodes.TooLong,
        field: 'subject',
        params: { maxLength: 255, actualLength: 256 },
      },
    });
  });
});
