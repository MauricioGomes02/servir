import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { OrganizationAccessReader } from '../application';
import {
  AuthenticationErrorCodes,
  createAuthenticatedActor,
  parseAuthenticatedUserId,
} from '@/shared/application/authentication';
import { parseCorrelationId, parseRequestId } from '@/shared/application/context';
import { success } from '@/shared/core/result';
import { createFastifyApplication, httpProblemMessageCatalog } from '@/shared/infrastructure/http';
import { SequenceIdGenerator } from '@/shared/infrastructure/id-generator';
import { InMemoryMessageTranslator } from '@/shared/infrastructure/localization';
import { InMemoryLogger } from '@/shared/infrastructure/logging';
import { registerOrganizationAccessGuard } from './register-organization-access-guard';
import { identityMessageCatalog } from '../presentation';

function requireValue<T>(result: { success: true; value: T } | { success: false }): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('invalid deterministic fixture');
  return result.value;
}

function createApp(accessReader: OrganizationAccessReader) {
  const actor = createAuthenticatedActor(
    requireValue(parseAuthenticatedUserId('0198f334-6dc5-7c20-9af1-91d7e599c703')),
  );
  const translator = new InMemoryMessageTranslator({
    'pt-BR': { ...httpProblemMessageCatalog['pt-BR'], ...identityMessageCatalog['pt-BR'] },
    'en-US': { ...httpProblemMessageCatalog['en-US'], ...identityMessageCatalog['en-US'] },
  });
  const app = createFastifyApplication({
    accessTokenVerifier: {
      async verify() {
        return success(actor);
      },
    },
    correlationIdGenerator: new SequenceIdGenerator([
      requireValue(parseCorrelationId('authorization-test')),
    ]),
    logger: new InMemoryLogger(),
    messageTranslator: translator,
    requestIdGenerator: new SequenceIdGenerator([
      requireValue(parseRequestId('authorization-request')),
    ]),
  });
  registerOrganizationAccessGuard(app, accessReader, translator);
  app.get('/organizations/:organizationId/resource', async () => ({ allowed: true }));
  return app;
}

describe('registerOrganizationAccessGuard', () => {
  it('allows an authenticated user with active tenant access', async () => {
    const app = createApp({
      async hasActiveAccess() {
        return true;
      },
    });
    const response = await app.inject({
      method: 'GET',
      url: '/organizations/0198f334-6dc5-7c20-9af1-91d7e599c702/resource',
      headers: { authorization: 'Bearer access-token' },
    });
    await app.close();
    assert.equal(response.statusCode, 200);
  });

  it('forbids an authenticated user without active tenant access', async () => {
    const app = createApp({
      async hasActiveAccess() {
        return false;
      },
    });
    const response = await app.inject({
      method: 'GET',
      url: '/organizations/0198f334-6dc5-7c20-9af1-91d7e599c702/resource',
      headers: { authorization: 'Bearer access-token' },
    });
    await app.close();
    assert.equal(response.statusCode, 403);
    assert.match(response.headers['content-type'] ?? '', /^application\/problem\+json/);
    assert.deepEqual(response.json(), {
      type: '/problems/authorization-denied',
      title: 'Voc\u00ea n\u00e3o possui permiss\u00e3o para realizar esta opera\u00e7\u00e3o.',
      status: 403,
      instance: 'urn:servir:request:authorization-request',
      correlationId: 'authorization-test',
      errors: [
        {
          code: 'identity.organization_access.forbidden',
          detail: 'Voc\u00ea n\u00e3o possui acesso a esta organiza\u00e7\u00e3o.',
        },
      ],
    });
  });

  it('requires authentication before checking tenant access', async () => {
    let reads = 0;
    const app = createApp({
      async hasActiveAccess() {
        reads += 1;
        return true;
      },
    });
    const response = await app.inject({
      method: 'GET',
      url: '/organizations/0198f334-6dc5-7c20-9af1-91d7e599c702/resource',
    });
    await app.close();
    assert.equal(response.statusCode, 401);
    assert.equal(reads, 0);
    assert.equal(response.headers['www-authenticate'], 'Bearer');
    assert.equal(response.json().errors[0].code, AuthenticationErrorCodes.MissingAccessToken);
  });
});
