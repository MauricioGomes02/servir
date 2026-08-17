import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  AuthenticatedActorErrorCodes,
  createAuthenticatedActor,
  parseAuthenticatedUserId,
} from '.';

describe('AuthenticatedActor', () => {
  it('identifies the authenticated user with a canonical internal ID', () => {
    const userId = parseAuthenticatedUserId(' 0198F334-6DC5-7C20-9AF1-91D7E599E011 ');
    assert.equal(userId.success, true);
    if (!userId.success) return;

    const actor = createAuthenticatedActor(userId.value);

    assert.deepEqual(actor, {
      userId: '0198f334-6dc5-7c20-9af1-91d7e599e011',
    });
    assert.equal(Object.isFrozen(actor), true);
  });

  it('rejects an empty user ID', () => {
    assert.deepEqual(parseAuthenticatedUserId(''), {
      success: false,
      error: { code: AuthenticatedActorErrorCodes.Empty, field: 'userId' },
    });
  });

  it('rejects a user ID that is not a canonical UUID', () => {
    assert.deepEqual(parseAuthenticatedUserId('provider-subject'), {
      success: false,
      error: {
        code: AuthenticatedActorErrorCodes.InvalidFormat,
        field: 'userId',
      },
    });
  });
});
