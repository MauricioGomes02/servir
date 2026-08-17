import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  AuthenticationErrorCodes,
  createAuthenticatedActor,
  parseAuthenticatedUserId,
} from '@/shared/application/authentication';
import { createExecutionContext, parseCorrelationId } from '@/shared/application/context';

import { HttpAuthenticationError } from './http-authentication-error';
import { requireAuthenticatedActor } from './require-authenticated-actor';

function value<T>(
  result: { readonly success: true; readonly value: T } | { readonly success: false },
): T {
  if (!result.success) throw new Error('Invalid deterministic test fixture');
  return result.value;
}

describe('requireAuthenticatedActor', () => {
  it('returns the actor propagated by the entry adapter', () => {
    const actor = createAuthenticatedActor(
      value(parseAuthenticatedUserId('0198f334-6dc5-7c20-9af1-91d7e599e011')),
    );
    const context = createExecutionContext({
      actor,
      correlationId: value(parseCorrelationId('correlation-123')),
    });

    assert.equal(requireAuthenticatedActor(context), actor);
  });

  it('rejects a context without an authenticated actor', () => {
    const context = createExecutionContext({
      correlationId: value(parseCorrelationId('correlation-123')),
    });

    assert.throws(
      () => requireAuthenticatedActor(context),
      (error: unknown) =>
        error instanceof HttpAuthenticationError &&
        error.code === AuthenticationErrorCodes.MissingAccessToken &&
        error.statusCode === 401,
    );
  });
});
