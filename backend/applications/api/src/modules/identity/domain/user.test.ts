import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ExternalIdentity, ExternalIdentityErrorCodes, User, UserId, UserStatuses } from '.';

function value<T>(result: { success: true; value: T } | { success: false }): T {
  if (!result.success) throw new Error('Invalid deterministic test fixture');
  return result.value;
}

describe('User', () => {
  it('provisions an active global user with one external identity', () => {
    const identity = value(
      ExternalIdentity.create({
        issuer: 'https://identity.example.com',
        subject: 'user-123',
      }),
    );
    const user = User.provision(
      value(UserId.create('0198f334-6dc5-7c20-9af1-91d7e599e001')),
      identity,
    );

    assert.equal(user.status, UserStatuses.Active);
    assert.deepEqual(user.externalIdentities, [identity]);
    assert.equal(Object.isFrozen(user.externalIdentities), true);
    assert.deepEqual(user.pendingDomainEvents, []);
  });

  it('reports every malformed external identity field', () => {
    const result = ExternalIdentity.create({ issuer: '', subject: 123 });

    assert.equal(result.success, false);
    assert.deepEqual(!result.success && result.error.errors, [
      { code: ExternalIdentityErrorCodes.Empty, field: 'issuer', params: undefined },
      {
        code: ExternalIdentityErrorCodes.InvalidType,
        field: 'subject',
        params: undefined,
      },
    ]);
  });

  it('rejects an issuer that cannot be indexed safely', () => {
    const result = ExternalIdentity.create({ issuer: 'a'.repeat(256), subject: 'user-123' });

    assert.equal(result.success, false);
    assert.deepEqual(!result.success && result.error.errors[0], {
      code: ExternalIdentityErrorCodes.TooLong,
      field: 'issuer',
      params: { maxLength: 255, actualLength: 256 },
    });
  });

  it('accepts only a canonical user UUID', () => {
    assert.equal(UserId.create('0198F334-6DC5-7C20-9AF1-91D7E599E001').success, true);
    assert.deepEqual(UserId.create('not-a-user-id'), {
      success: false,
      error: { code: 'identity.user_id.invalid_format', field: 'userId' },
    });
  });
});
