import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  AuthenticatedActorErrorCodes,
  createAuthenticatedActor,
  parseIdentityIssuer,
  parseIdentitySubject,
} from '.';

describe('AuthenticatedActor', () => {
  it('preserves the provider identity without normalization', () => {
    const issuer = parseIdentityIssuer('https://identity.example.com/tenant/');
    const subject = parseIdentitySubject(' Subject-With-Provider-Semantics ');
    assert.equal(issuer.success, true);
    assert.equal(subject.success, true);
    if (!issuer.success || !subject.success) return;

    const actor = createAuthenticatedActor({ issuer: issuer.value, subject: subject.value });

    assert.deepEqual(actor, {
      issuer: 'https://identity.example.com/tenant/',
      subject: ' Subject-With-Provider-Semantics ',
    });
    assert.equal(Object.isFrozen(actor), true);
  });

  it('rejects an empty subject', () => {
    assert.deepEqual(parseIdentitySubject(''), {
      success: false,
      error: { code: AuthenticatedActorErrorCodes.Empty, field: 'subject' },
    });
  });

  it('rejects a subject longer than the OIDC limit', () => {
    assert.deepEqual(parseIdentitySubject('a'.repeat(256)), {
      success: false,
      error: {
        code: AuthenticatedActorErrorCodes.TooLong,
        field: 'subject',
        params: { maxLength: 255, actualLength: 256 },
      },
    });
  });
});
