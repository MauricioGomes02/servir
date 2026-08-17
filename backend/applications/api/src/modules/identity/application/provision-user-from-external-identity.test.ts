import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createAuthenticatedActor,
  createExternalIdentityAssertion,
  parseAuthenticatedUserId,
  parseIdentityIssuer,
  parseIdentitySubject,
} from '@/shared/application/authentication';
import { createExecutionContext, parseCorrelationId } from '@/shared/application/context';
import { SequenceIdGenerator } from '@/shared/infrastructure/id-generator';
import { InMemoryLogger } from '@/shared/infrastructure/logging';

import { ExternalIdentity, User, UserId } from '../domain';
import {
  ProvisionUserErrorCodes,
  ProvisionUserFromExternalIdentityHandler,
} from './provision-user-from-external-identity';
import type { UserProvisioner } from './user-provisioner';

const FIRST_USER_ID = '0198f334-6dc5-7c20-9af1-91d7e599e011';
const EXISTING_USER_ID = '0198f334-6dc5-7c20-9af1-91d7e599e012';

function value<T>(result: { success: true; value: T } | { success: false }): T {
  if (!result.success) throw new Error('Invalid deterministic test fixture');
  return result.value;
}

const assertion = createExternalIdentityAssertion({
  issuer: value(parseIdentityIssuer('https://identity.example.com')),
  subject: value(parseIdentitySubject('user-123')),
});
const actor = createAuthenticatedActor(value(parseAuthenticatedUserId(EXISTING_USER_ID)));
const correlationId = value(parseCorrelationId('identity-provisioning-test'));

describe('ProvisionUserFromExternalIdentityHandler', () => {
  it('provisions a candidate only from the external identity assertion', async () => {
    let received: User | undefined;
    const users: UserProvisioner = {
      async provision(candidate) {
        received = candidate;
        return Object.freeze({ created: true, user: candidate });
      },
    };
    const handler = new ProvisionUserFromExternalIdentityHandler({
      logger: new InMemoryLogger(),
      userIdGenerator: new SequenceIdGenerator([value(UserId.create(FIRST_USER_ID))]),
      users,
    });

    const result = await handler.handle(
      createExecutionContext({ externalIdentityAssertion: assertion, correlationId }),
    );

    assert.equal(result.success, true);
    assert.equal(received?.externalIdentities[0]?.issuer, assertion.issuer);
    assert.equal(received?.externalIdentities[0]?.subject, assertion.subject);
    assert.equal(result.success && result.value.userId.toString(), FIRST_USER_ID);
    assert.equal(result.success && result.value.created, true);
  });

  it('returns the existing user selected by idempotent persistence', async () => {
    const existing = User.provision(
      value(UserId.create(EXISTING_USER_ID)),
      value(ExternalIdentity.create(assertion)),
    );
    const users: UserProvisioner = {
      async provision() {
        return Object.freeze({ created: false, user: existing });
      },
    };
    const handler = new ProvisionUserFromExternalIdentityHandler({
      logger: new InMemoryLogger(),
      userIdGenerator: new SequenceIdGenerator([value(UserId.create(FIRST_USER_ID))]),
      users,
    });

    const result = await handler.handle(
      createExecutionContext({ externalIdentityAssertion: assertion, correlationId }),
    );

    assert.equal(result.success, true);
    assert.equal(result.success && result.value.userId.toString(), EXISTING_USER_ID);
    assert.equal(result.success && result.value.created, false);
  });

  it('rejects an ordinary authenticated actor before persistence', async () => {
    let calls = 0;
    const users: UserProvisioner = {
      async provision(candidate) {
        calls += 1;
        return Object.freeze({ created: true, user: candidate });
      },
    };
    const handler = new ProvisionUserFromExternalIdentityHandler({
      logger: new InMemoryLogger(),
      userIdGenerator: new SequenceIdGenerator([value(UserId.create(FIRST_USER_ID))]),
      users,
    });

    const result = await handler.handle(createExecutionContext({ actor, correlationId }));

    assert.deepEqual(result, {
      success: false,
      error: { code: ProvisionUserErrorCodes.ExternalIdentityAssertionRequired },
    });
    assert.equal(calls, 0);
  });
});
