import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CreateOrganizationHandler } from '@/modules/organizations/application';
import { OrganizationId } from '@/modules/organizations/domain';
import {
  CreateOrganizationPresenter,
  organizationMessageCatalog,
} from '@/modules/organizations/presentation';
import { parseCorrelationId, parseRequestId } from '@/shared/application/context';
import { parseMessageId } from '@/shared/application/messaging';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';
import { FixedClock } from '@/shared/infrastructure/clock';
import { createFastifyApplication, httpProblemMessageCatalog } from '@/shared/infrastructure/http';
import { SequenceIdGenerator } from '@/shared/infrastructure/id-generator';
import { InMemoryMessageTranslator } from '@/shared/infrastructure/localization';
import { InMemoryLogger } from '@/shared/infrastructure/logging';
import { InMemoryEventOutbox } from '@/shared/infrastructure/messaging';
import { DirectUnitOfWork } from '@/shared/infrastructure/unit-of-work';

import { InMemoryOrganizationRepository } from '../../persistence';
import { registerCreateOrganizationRoute } from './register-create-organization-route';

function fixture() {
  const correlationId = parseCorrelationId('correlation-123');
  const requestId = parseRequestId('request-123');
  const organizationId = OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599c7b1');
  const domainEventId = parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599c7b2');
  const messageId = parseMessageId('0198f334-6dc5-7c20-9af1-91d7e599c7b3');
  const instant = Instant.create('2026-07-28T12:00:00.000Z');

  assert.equal(correlationId.success, true);
  assert.equal(requestId.success, true);
  assert.equal(organizationId.success, true);
  assert.equal(domainEventId.success, true);
  assert.equal(messageId.success, true);
  assert.equal(instant.success, true);

  if (
    !correlationId.success ||
    !requestId.success ||
    !organizationId.success ||
    !domainEventId.success ||
    !messageId.success ||
    !instant.success
  ) {
    throw new Error('Invalid deterministic test fixture');
  }

  const organizations = new InMemoryOrganizationRepository();
  const outbox = new InMemoryEventOutbox();
  const logger = new InMemoryLogger();
  const translator = new InMemoryMessageTranslator({
    'pt-BR': {
      ...httpProblemMessageCatalog['pt-BR'],
      ...organizationMessageCatalog['pt-BR'],
    },
    'en-US': {
      ...httpProblemMessageCatalog['en-US'],
      ...organizationMessageCatalog['en-US'],
    },
  });
  const handler = new CreateOrganizationHandler({
    clock: new FixedClock(instant.value),
    organizationIdGenerator: new SequenceIdGenerator([organizationId.value]),
    domainEventIdGenerator: new SequenceIdGenerator([domainEventId.value]),
    messageIdGenerator: new SequenceIdGenerator([messageId.value]),
    unitOfWork: new DirectUnitOfWork({ organizations, outbox }),
    logger,
  });
  const presenter = new CreateOrganizationPresenter(translator);
  const app = createFastifyApplication({
    correlationIdGenerator: new SequenceIdGenerator([correlationId.value]),
    logger,
    messageTranslator: translator,
    requestIdGenerator: new SequenceIdGenerator([requestId.value]),
  });

  registerCreateOrganizationRoute(app, {
    handler,
    messageTranslator: translator,
    presenter,
  });

  return { app, organizations, outbox };
}

describe('registerCreateOrganizationRoute', () => {
  it('creates an organization through the request context', async () => {
    const { app, organizations, outbox } = fixture();

    const response = await app.inject({
      method: 'POST',
      url: '/organizations',
      payload: {
        name: 'Comunidade Servir',
      },
    });
    await app.close();

    assert.equal(response.statusCode, 201);
    assert.deepEqual(response.json(), {
      id: '0198f334-6dc5-7c20-9af1-91d7e599c7b1',
      name: 'Comunidade Servir',
    });
    assert.equal(response.headers.location, '/organizations/0198f334-6dc5-7c20-9af1-91d7e599c7b1');
    assert.equal(response.headers['x-correlation-id'], 'correlation-123');
    assert.equal(organizations.organizations.length, 1);
    assert.equal(outbox.envelopes.length, 1);
    assert.equal(outbox.envelopes[0]?.correlationId, 'correlation-123');
  });

  it('presents invalid input in the negotiated locale without persisting', async () => {
    const { app, organizations, outbox } = fixture();

    const response = await app.inject({
      method: 'POST',
      url: '/organizations',
      headers: {
        'accept-language': 'en-US',
      },
      payload: {},
    });
    await app.close();

    assert.equal(response.statusCode, 422);
    assert.match(response.headers['content-type'] ?? '', /^application\/problem\+json/);
    assert.equal(response.headers['content-language'], 'en-US');
    assert.deepEqual(response.json(), {
      type: '/problems/validation-error',
      title: 'The request contains invalid data.',
      status: 422,
      instance: 'urn:servir:request:request-123',
      correlationId: 'correlation-123',
      errors: [
        {
          code: 'organization.name.invalid_type',
          detail: 'The organization name must be text.',
          pointer: '#/name',
        },
      ],
    });
    assert.equal(organizations.organizations.length, 0);
    assert.equal(outbox.envelopes.length, 0);
  });
});
