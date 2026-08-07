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
import { InMemoryEventOutbox } from '@/shared/infrastructure/messaging';
import { DirectUnitOfWork } from '@/shared/infrastructure/unit-of-work';
import { InMemoryLogger } from '@/shared/infrastructure/logging';

import { OrganizationId, OrganizationNameErrorCodes } from '../../../domain';
import { InMemoryOrganizationRepository } from '@/composition/test-support';
import type { OrganizationWriteScope } from '../../ports';
import { CreateOrganizationHandler } from '.';

function fixtureIds() {
  const organizationId = OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599c7b1');
  const eventId = parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599c7b2');
  const messageId = parseMessageId('0198f334-6dc5-7c20-9af1-91d7e599c7b3');
  const correlationId = parseCorrelationId('correlation-123');
  const occurredAt = Instant.create('2026-07-28T15:00:00.000Z');

  assert.equal(organizationId.success, true);
  assert.equal(eventId.success, true);
  assert.equal(messageId.success, true);
  assert.equal(correlationId.success, true);
  assert.equal(occurredAt.success, true);

  if (
    !organizationId.success ||
    !eventId.success ||
    !messageId.success ||
    !correlationId.success ||
    !occurredAt.success
  ) {
    throw new Error('Invalid deterministic test fixture');
  }

  return {
    organizationId: organizationId.value,
    eventId: eventId.value,
    messageId: messageId.value,
    correlationId: correlationId.value,
    occurredAt: occurredAt.value,
  };
}

function createFixture(outbox: EventOutbox = new InMemoryEventOutbox()) {
  const ids = fixtureIds();
  const organizations = new InMemoryOrganizationRepository();
  const scope: OrganizationWriteScope = {
    organizations,
    outbox,
  };
  const unitOfWork = new DirectUnitOfWork(scope);
  const logger = new InMemoryLogger();
  const handler = new CreateOrganizationHandler({
    clock: new FixedClock(ids.occurredAt),
    organizationIdGenerator: new SequenceIdGenerator([ids.organizationId]),
    domainEventIdGenerator: new SequenceIdGenerator<DomainEventId>([ids.eventId]),
    messageIdGenerator: new SequenceIdGenerator<MessageId>([ids.messageId]),
    unitOfWork,
    logger,
  });
  const context = createExecutionContext({
    correlationId: ids.correlationId,
  });

  return {
    handler,
    context,
    ids,
    organizations,
    outbox,
    logger,
  };
}

describe('CreateOrganizationHandler', () => {
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
    assert.equal(fixture.organizations.organizations.length, 1);
    assert.deepEqual(fixture.organizations.organizations[0]?.pendingDomainEvents, []);

    assert.equal(fixture.outbox instanceof InMemoryEventOutbox, true);

    if (!(fixture.outbox instanceof InMemoryEventOutbox)) {
      return;
    }

    assert.equal(fixture.outbox.envelopes.length, 1);
    assert.equal(fixture.outbox.envelopes[0]?.correlationId, fixture.ids.correlationId);
    assert.equal(fixture.outbox.envelopes[0]?.messageId, fixture.ids.messageId);
    assert.equal(fixture.outbox.envelopes[0]?.event.name, 'organization.created');
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
    assert.deepEqual(fixture.organizations.organizations, []);

    assert.equal(fixture.outbox instanceof InMemoryEventOutbox, true);

    if (fixture.outbox instanceof InMemoryEventOutbox) {
      assert.deepEqual(fixture.outbox.envelopes, []);
    }
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
    assert.equal(fixture.organizations.organizations.length, 1);
    assert.equal(fixture.organizations.organizations[0]?.pendingDomainEvents.length, 1);
  });
});
