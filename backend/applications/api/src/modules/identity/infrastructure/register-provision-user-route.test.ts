import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  AuthenticationErrorCodes,
  createExternalIdentityAssertion,
  parseIdentityIssuer,
  parseIdentitySubject,
  type BootstrapAssertionVerifier,
} from '@/shared/application/authentication';
import { parseCorrelationId, parseRequestId } from '@/shared/application/context';
import { failure, success } from '@/shared/core/result';
import { createFastifyApplication, httpProblemMessageCatalog } from '@/shared/infrastructure/http';
import { SequenceIdGenerator } from '@/shared/infrastructure/id-generator';
import { InMemoryMessageTranslator } from '@/shared/infrastructure/localization';
import { InMemoryLogger } from '@/shared/infrastructure/logging';
import { identityMessageCatalog } from '../presentation';
import { ExternalIdentityErrorCodes } from '../domain';
import { registerProvisionUserRoute } from './register-provision-user-route';

function value<T>(result: { success: true; value: T } | { success: false }): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('invalid deterministic fixture');
  return result.value;
}

const translator = new InMemoryMessageTranslator({
  'pt-BR': { ...httpProblemMessageCatalog['pt-BR'], ...identityMessageCatalog['pt-BR'] },
  'en-US': { ...httpProblemMessageCatalog['en-US'], ...identityMessageCatalog['en-US'] },
});

function application(
  bootstrapAssertionVerifier: BootstrapAssertionVerifier,
  handler: Parameters<typeof registerProvisionUserRoute>[1]['handler'],
) {
  const app = createFastifyApplication({
    correlationIdGenerator: new SequenceIdGenerator([
      value(parseCorrelationId('provision-user-correlation')),
    ]),
    logger: new InMemoryLogger(),
    messageTranslator: translator,
    requestIdGenerator: new SequenceIdGenerator([value(parseRequestId('provision-user-request'))]),
  });
  registerProvisionUserRoute(app, {
    bootstrapAssertionVerifier,
    handler,
    messageTranslator: translator,
  });
  return app;
}

describe('registerProvisionUserRoute', () => {
  it('presents an invalid bootstrap assertion as a coded authentication problem', async () => {
    const app = application(
      {
        async verifyBootstrapAssertion() {
          return failure({ code: AuthenticationErrorCodes.ExpiredBootstrapAssertion });
        },
      },
      {
        async handle() {
          throw new Error('handler must not be called');
        },
      },
    );

    const response = await app.inject({
      method: 'POST',
      url: '/identity/users/provision',
      headers: { authorization: 'Bearer expired-assertion', 'accept-language': 'en-US' },
    });
    await app.close();

    assert.equal(response.statusCode, 401);
    assert.equal(response.headers['www-authenticate'], 'Bearer');
    assert.equal(response.headers['content-language'], 'en-US');
    assert.equal(
      response.json().errors[0].code,
      AuthenticationErrorCodes.ExpiredBootstrapAssertion,
    );
  });

  it('preserves validation code, field and parameters in localized Problem Details', async () => {
    const assertion = createExternalIdentityAssertion({
      issuer: value(parseIdentityIssuer('https://issuer.example')),
      subject: value(parseIdentitySubject('subject-123')),
    });
    const app = application(
      {
        async verifyBootstrapAssertion() {
          return success(assertion);
        },
      },
      {
        async handle() {
          return failure({
            code: ExternalIdentityErrorCodes.TooLong,
            field: 'issuer' as const,
            params: { maxLength: 255 },
            errors: [
              {
                code: ExternalIdentityErrorCodes.TooLong,
                field: 'issuer' as const,
                params: { maxLength: 255 },
              },
            ] as const,
          });
        },
      },
    );

    const response = await app.inject({
      method: 'POST',
      url: '/identity/users/provision',
      headers: { authorization: 'Bearer valid-assertion', 'accept-language': 'en-US' },
    });
    await app.close();

    assert.equal(response.statusCode, 422);
    assert.match(response.headers['content-type'] ?? '', /^application\/problem\+json/);
    assert.deepEqual(response.json().errors, [
      {
        code: ExternalIdentityErrorCodes.TooLong,
        detail: 'The external identity value must have at most 255 characters.',
        pointer: '#/issuer',
        parameters: { maxLength: 255 },
      },
    ]);
  });
});
