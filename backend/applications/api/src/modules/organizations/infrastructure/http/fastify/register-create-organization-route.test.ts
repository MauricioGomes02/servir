import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CreateOrganizationHandler,
  CreateOrganizationMessage,
  type OrganizationWriteScope,
} from '@/modules/organizations/application';
import { OrganizationId, type Organization } from '@/modules/organizations/domain';
import {
  CreateOrganizationPresenter,
  organizationMessageCatalog,
} from '@/modules/organizations/presentation';
import { parseCorrelationId, parseRequestId } from '@/shared/application/context';
import { parseMessageId, type EventEnvelope } from '@/shared/application/messaging';
import { Mediator } from '@/shared/application/mediator';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';
import { FixedClock } from '@/shared/infrastructure/clock';
import { createFastifyApplication, httpProblemMessageCatalog } from '@/shared/infrastructure/http';
import { SequenceIdGenerator } from '@/shared/infrastructure/id-generator';
import { InMemoryMessageTranslator } from '@/shared/infrastructure/localization';
import { InMemoryLogger } from '@/shared/infrastructure/logging';
import { registerCreateOrganizationRoute } from './register-create-organization-route';
import {
  createAuthenticatedActor,
  parseAuthenticatedUserId,
} from '@/shared/application/authentication';
import { success } from '@/shared/core/result';
import { OrganizationAccessId } from '@/modules/identity/domain';

function fixture() {
  const correlationId = parseCorrelationId('correlation-123');
  const requestId = parseRequestId('request-123');
  const organizationId = OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599c7b1');
  const domainEventId = parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599c7b2');
  const messageId = parseMessageId('0198f334-6dc5-7c20-9af1-91d7e599c7b3');
  const instant = Instant.create('2026-07-28T12:00:00.000Z');
  const accessId = OrganizationAccessId.create('0198f334-6dc5-7c20-9af1-91d7e599c7b4');
  const userId = parseAuthenticatedUserId('0198f334-6dc5-7c20-9af1-91d7e599c7b5');

  assert.equal(correlationId.success, true);
  assert.equal(requestId.success, true);
  assert.equal(organizationId.success, true);
  assert.equal(domainEventId.success, true);
  assert.equal(messageId.success, true);
  assert.equal(instant.success, true);
  assert.equal(accessId.success, true);
  assert.equal(userId.success, true);

  if (
    !correlationId.success ||
    !requestId.success ||
    !organizationId.success ||
    !domainEventId.success ||
    !messageId.success ||
    !instant.success ||
    !accessId.success ||
    !userId.success
  ) {
    throw new Error('Invalid deterministic test fixture');
  }

  const organizations: Organization[] = [];
  const envelopes: EventEnvelope[] = [];
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
  const scope: OrganizationWriteScope = {
    organizations: {
      async save(organization: Organization) {
        organizations.push(organization);
      },
    },
    organizationAccesses: { async add() {} },
    outbox: {
      async add(received: readonly EventEnvelope[]) {
        envelopes.push(...received);
      },
    },
  };
  const unitOfWork: UnitOfWork<OrganizationWriteScope> = {
    async execute(work) {
      return work(scope);
    },
  };
  const handler = new CreateOrganizationHandler({
    clock: new FixedClock(instant.value),
    organizationIdGenerator: new SequenceIdGenerator([organizationId.value]),
    organizationAccessIdGenerator: new SequenceIdGenerator([accessId.value]),
    domainEventIdGenerator: new SequenceIdGenerator([domainEventId.value]),
    messageIdGenerator: new SequenceIdGenerator([messageId.value]),
    unitOfWork,
    logger,
  });
  const presenter = new CreateOrganizationPresenter(translator);
  const mediator = new Mediator();
  mediator.register(CreateOrganizationMessage, handler.handle.bind(handler));
  const app = createFastifyApplication({
    accessTokenVerifier: {
      async verify() {
        return success(createAuthenticatedActor(userId.value));
      },
    },
    correlationIdGenerator: new SequenceIdGenerator([correlationId.value]),
    logger,
    messageTranslator: translator,
    requestIdGenerator: new SequenceIdGenerator([requestId.value]),
  });

  registerCreateOrganizationRoute(app, {
    mediator,
    messageTranslator: translator,
    presenter,
  });

  return { app, organizations, envelopes };
}

describe('registerCreateOrganizationRoute', () => {
  it('creates an organization through the request context', async () => {
    const { app, organizations, envelopes } = fixture();

    const response = await app.inject({
      method: 'POST',
      url: '/organizations',
      headers: { authorization: 'Bearer access-token' },
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
    assert.equal(organizations.length, 1);
    assert.equal(envelopes.length, 1);
    assert.equal(envelopes[0]?.correlationId, 'correlation-123');
  });

  it('presents invalid input in the negotiated locale without persisting', async () => {
    const { app, organizations, envelopes } = fixture();

    const response = await app.inject({
      method: 'POST',
      url: '/organizations',
      headers: {
        'accept-language': 'en-US',
        authorization: 'Bearer access-token',
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
          detail: 'The church name must be text.',
          pointer: '#/name',
        },
      ],
    });
    assert.equal(organizations.length, 0);
    assert.equal(envelopes.length, 0);
  });
});
