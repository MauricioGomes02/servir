import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createExecutionContext, parseCorrelationId } from '@/shared/application/context';
import {
  parseMessageId,
  type EventEnvelope,
  type EventOutbox,
  type MessageId,
} from '@/shared/application/messaging';
import { parseDomainEventId, type DomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';
import { FixedClock } from '@/shared/infrastructure/clock';
import { SequenceIdGenerator } from '@/shared/infrastructure/id-generator';
import { InMemoryLogger } from '@/shared/infrastructure/logging';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import {
  createAuthenticatedActor,
  parseAuthenticatedUserId,
} from '@/shared/application/authentication';
import { OrganizationAccessId, type OrganizationAccess } from '@/modules/identity/domain';

import { OrganizationId, OrganizationNameErrorCodes, type Organization } from '../../../domain';
import type { OrganizationWriteScope } from '../../ports';
import { CreateOrganizationHandler } from '.';

function fixtureIds() {
  const organizationId = OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599c7b1');
  const organizationAccessId = OrganizationAccessId.create('0198f334-6dc5-7c20-9af1-91d7e599c7b4');
  const userId = parseAuthenticatedUserId('0198f334-6dc5-7c20-9af1-91d7e599c7b5');
  const eventId = parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599c7b2');
  const messageId = parseMessageId('0198f334-6dc5-7c20-9af1-91d7e599c7b3');
  const correlationId = parseCorrelationId('correlation-123');
  const occurredAt = Instant.create('2026-07-28T15:00:00.000Z');

  assert.equal(organizationId.success, true);
  assert.equal(eventId.success, true);
  assert.equal(messageId.success, true);
  assert.equal(correlationId.success, true);
  assert.equal(occurredAt.success, true);
  assert.equal(organizationAccessId.success, true);
  assert.equal(userId.success, true);

  if (
    !organizationId.success ||
    !eventId.success ||
    !messageId.success ||
    !correlationId.success ||
    !occurredAt.success ||
    !organizationAccessId.success ||
    !userId.success
  ) {
    throw new Error('Invalid deterministic test fixture');
  }

  return {
    organizationId: organizationId.value,
    organizationAccessId: organizationAccessId.value,
    userId: userId.value,
    eventId: eventId.value,
    messageId: messageId.value,
    correlationId: correlationId.value,
    occurredAt: occurredAt.value,
  };
}

function createFixture(outbox?: EventOutbox) {
  const ids = fixtureIds();
  const storedOrganizations: Organization[] = [];
  const storedAccesses: OrganizationAccess[] = [];
  const organizations = {
    async save(organization: Organization) {
      storedOrganizations.push(organization);
    },
  };
  const storedEnvelopes: EventEnvelope[] = [];
  const recordingOutbox: EventOutbox = outbox ?? {
    async add(envelopes) {
      storedEnvelopes.push(...envelopes);
    },
  };
  const scope: OrganizationWriteScope = {
    organizations,
    organizationAccesses: {
      async add(access) {
        storedAccesses.push(access);
      },
    },
    outbox: recordingOutbox,
  };
  const unitOfWork: UnitOfWork<OrganizationWriteScope> = {
    async execute(work) {
      return work(scope);
    },
  };
  const logger = new InMemoryLogger();
  const handler = new CreateOrganizationHandler({
    clock: new FixedClock(ids.occurredAt),
    organizationIdGenerator: new SequenceIdGenerator([ids.organizationId]),
    organizationAccessIdGenerator: new SequenceIdGenerator([ids.organizationAccessId]),
    domainEventIdGenerator: new SequenceIdGenerator<DomainEventId>([ids.eventId]),
    messageIdGenerator: new SequenceIdGenerator<MessageId>([ids.messageId]),
    unitOfWork,
    logger,
  });
  const context = createExecutionContext({
    actor: createAuthenticatedActor(ids.userId),
    correlationId: ids.correlationId,
  });

  return {
    handler,
    context,
    ids,
    organizations,
    outbox: recordingOutbox,
    storedOrganizations,
    storedAccesses,
    storedEnvelopes,
    logger,
  };
}

describe('CreateOrganizationHandler', () => {
  it('requires an authenticated creator before persisting', async () => {
    const fixture = createFixture();
    const result = await fixture.handler.handle(
      { name: 'Comunidade Servir' },
      createExecutionContext({ correlationId: fixture.ids.correlationId }),
    );

    assert.deepEqual(result, {
      success: false,
      error: { code: 'organization.creation.authenticated_actor_required' },
    });
    assert.deepEqual(fixture.storedOrganizations, []);
    assert.deepEqual(fixture.storedAccesses, []);
    assert.deepEqual(fixture.storedEnvelopes, []);
  });

  it('persists the organization and envelope in the same scope', async () => {
    const fixture = createFixture();

    const result = await fixture.handler.handle(
      {
        name: 'Comunidade Servir',
      },
      fixture.context,
    );

    assert.equal(result.success, true);

    if (!result.success) {
      return;
    }

    assert.equal(result.value.organizationId, fixture.ids.organizationId);
    assert.equal(result.value.name, 'Comunidade Servir');
    assert.equal(fixture.storedOrganizations.length, 1);
    assert.equal(fixture.storedAccesses.length, 1);
    assert.equal(fixture.storedAccesses[0]?.role, 'owner');
    assert.equal(fixture.storedAccesses[0]?.userId.toString(), fixture.ids.userId);
    assert.deepEqual(fixture.storedOrganizations[0]?.pendingDomainEvents, []);
    assert.equal(fixture.storedEnvelopes.length, 1);
    assert.equal(fixture.storedEnvelopes[0]?.correlationId, fixture.ids.correlationId);
    assert.equal(fixture.storedEnvelopes[0]?.messageId, fixture.ids.messageId);
    assert.equal(fixture.storedEnvelopes[0]?.event.name, 'organization.created');
  });

  it('records the successful business process without personal data', async () => {
    const fixture = createFixture();

    await fixture.handler.handle({ name: 'Comunidade Servir' }, fixture.context);

    assert.deepEqual(
      fixture.logger.records.map((record) => record.eventName),
      [
        'organization.creation.started',
        'organization.creation.validated',
        'organization.creation.persisted',
        'organization.creation.completed',
      ],
    );
    assert.equal(JSON.stringify(fixture.logger.records).includes('Comunidade Servir'), false);
    assert.deepEqual(fixture.logger.records[2]?.attributes, {
      'organization.id': fixture.ids.organizationId.value,
      'domain_event.count': 1,
    });
  });

  it('records an expected rejection without persistence milestones', async () => {
    const fixture = createFixture();

    await fixture.handler.handle({ name: '   ' }, fixture.context);

    assert.deepEqual(
      fixture.logger.records.map((record) => record.eventName),
      ['organization.creation.started', 'organization.creation.rejected'],
    );
    assert.deepEqual(fixture.logger.records[1]?.attributes, {
      'error.code': OrganizationNameErrorCodes.Empty,
      'error.field': 'name',
    });
  });

  it('returns an expected failure without persisting state or event', async () => {
    const fixture = createFixture();

    const result = await fixture.handler.handle(
      {
        name: '   ',
      },
      fixture.context,
    );

    assert.equal(result.success, false);

    if (result.success) {
      return;
    }

    assert.equal(result.error.code, OrganizationNameErrorCodes.Empty);
    assert.deepEqual(fixture.storedOrganizations, []);
    assert.deepEqual(fixture.storedEnvelopes, []);
  });

  it('keeps the event pending when atomic persistence fails', async () => {
    const failure = new Error('outbox unavailable');
    const received: EventEnvelope[] = [];
    const failingOutbox: EventOutbox = {
      async add(envelopes) {
        received.push(...envelopes);
        throw failure;
      },
    };
    const fixture = createFixture(failingOutbox);

    await assert.rejects(
      fixture.handler.handle(
        {
          name: 'Comunidade Servir',
        },
        fixture.context,
      ),
      (error: unknown) => error === failure,
    );

    assert.equal(received.length, 1);
    assert.equal(fixture.storedOrganizations.length, 1);
    assert.equal(fixture.storedOrganizations[0]?.pendingDomainEvents.length, 1);
  });
});
