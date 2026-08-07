import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { OrganizationId, OrganizationIdErrorCodes } from '@/modules/organizations/domain';
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

import {
  MemberId,
  MemberNameErrorCodes,
  MemberRegistrationPolicy,
  MemberRegistrationPolicyErrorCodes,
} from '../../../domain';
import {
  InMemoryMemberRepository,
  InMemoryOrganizationRegistrationFactsReader,
} from '../../../infrastructure';
import type { MemberWriteScope } from '../../ports';
import { RegisterMemberHandler } from '.';

function fixtureIds() {
  const organizationId = OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599c7b1');
  const memberId = MemberId.create('0198f334-6dc5-7c20-9af1-91d7e599d7b1');
  const eventId = parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599d7b2');
  const messageId = parseMessageId('0198f334-6dc5-7c20-9af1-91d7e599d7b3');
  const correlationId = parseCorrelationId('correlation-123');
  const occurredAt = Instant.create('2026-08-03T15:00:00.000Z');

  assert.equal(organizationId.success, true);
  assert.equal(memberId.success, true);
  assert.equal(eventId.success, true);
  assert.equal(messageId.success, true);
  assert.equal(correlationId.success, true);
  assert.equal(occurredAt.success, true);

  if (
    !organizationId.success ||
    !memberId.success ||
    !eventId.success ||
    !messageId.success ||
    !correlationId.success ||
    !occurredAt.success
  ) {
    throw new Error('Invalid deterministic test fixture');
  }

  return {
    organizationId: organizationId.value,
    memberId: memberId.value,
    eventId: eventId.value,
    messageId: messageId.value,
    correlationId: correlationId.value,
    occurredAt: occurredAt.value,
  };
}

function createFixture(options?: {
  readonly organizationExists?: boolean;
  readonly outbox?: EventOutbox;
}) {
  const ids = fixtureIds();
  const members = new InMemoryMemberRepository();
  const outbox = options?.outbox ?? new InMemoryEventOutbox();
  const organizations = options?.organizationExists === false ? [] : [ids.organizationId];
  const scope: MemberWriteScope = { members, outbox };
  const logger = new InMemoryLogger();
  const handler = new RegisterMemberHandler({
    clock: new FixedClock(ids.occurredAt),
    memberIdGenerator: new SequenceIdGenerator([ids.memberId]),
    domainEventIdGenerator: new SequenceIdGenerator<DomainEventId>([ids.eventId]),
    messageIdGenerator: new SequenceIdGenerator<MessageId>([ids.messageId]),
    organizationRegistrationFacts: new InMemoryOrganizationRegistrationFactsReader(organizations),
    registrationPolicy: new MemberRegistrationPolicy(),
    unitOfWork: new DirectUnitOfWork(scope),
    logger,
  });
  const context = createExecutionContext({
    correlationId: ids.correlationId,
  });

  return { handler, context, ids, members, outbox, logger };
}

describe('RegisterMemberHandler', () => {
  it('records eligibility and persistence without personal data', async () => {
    const fixture = createFixture();

    await fixture.handler.handle(
      {
        organizationId: fixture.ids.organizationId.value,
        name: 'Maria da Silva',
      },
      fixture.context,
    );

    assert.deepEqual(
      fixture.logger.records.map((record) => record.eventName),
      [
        'member.registration.started',
        'member.registration.organization.validated',
        'member.registration.eligibility.accepted',
        'member.registration.validated',
        'member.registration.persisted',
        'member.registration.completed',
      ],
    );
    assert.equal(JSON.stringify(fixture.logger.records).includes('Maria da Silva'), false);
  });

  it('records the policy rejection without persistence milestones', async () => {
    const fixture = createFixture({ organizationExists: false });

    await fixture.handler.handle(
      {
        organizationId: fixture.ids.organizationId.value,
        name: 'Maria da Silva',
      },
      fixture.context,
    );

    assert.equal(fixture.logger.records.at(-1)?.eventName, 'member.registration.rejected');
    assert.equal(
      fixture.logger.records.at(-1)?.attributes['error.code'],
      MemberRegistrationPolicyErrorCodes.OrganizationNotFound,
    );
    assert.equal(
      fixture.logger.records.some((record) => record.eventName === 'member.registration.persisted'),
      false,
    );
  });

  it('persists the member and envelope in the same scope', async () => {
    const fixture = createFixture();

    const result = await fixture.handler.handle(
      {
        organizationId: fixture.ids.organizationId.toString(),
        name: '  Maria da Silva  ',
      },
      fixture.context,
    );

    assert.equal(result.success, true);

    if (!result.success) {
      return;
    }

    assert.deepEqual(result.value, {
      memberId: fixture.ids.memberId,
      organizationId: fixture.ids.organizationId,
      name: 'Maria da Silva',
    });
    assert.equal(fixture.members.members.length, 1);
    assert.deepEqual(fixture.members.members[0]?.pendingDomainEvents, []);
    assert.equal(fixture.outbox instanceof InMemoryEventOutbox, true);

    if (!(fixture.outbox instanceof InMemoryEventOutbox)) {
      return;
    }

    assert.equal(fixture.outbox.envelopes.length, 1);
    assert.equal(fixture.outbox.envelopes[0]?.correlationId, fixture.ids.correlationId);
    assert.equal(fixture.outbox.envelopes[0]?.messageId, fixture.ids.messageId);
    assert.equal(fixture.outbox.envelopes[0]?.event.name, 'member.registered');
  });

  it('rejects an invalid organization identifier without persistence', async () => {
    const fixture = createFixture();

    const result = await fixture.handler.handle(
      {
        organizationId: 'not-an-id',
        name: 'Maria da Silva',
      },
      fixture.context,
    );

    assert.equal(result.success, false);

    if (result.success) {
      return;
    }

    assert.equal(result.error.code, OrganizationIdErrorCodes.InvalidFormat);
    assert.deepEqual(fixture.members.members, []);
  });

  it('rejects registration when the organization does not exist', async () => {
    const fixture = createFixture({ organizationExists: false });

    const result = await fixture.handler.handle(
      {
        organizationId: fixture.ids.organizationId.toString(),
        name: 'Maria da Silva',
      },
      fixture.context,
    );

    assert.equal(result.success, false);

    if (result.success) {
      return;
    }

    assert.equal(result.error.code, MemberRegistrationPolicyErrorCodes.OrganizationNotFound);
    assert.deepEqual(fixture.members.members, []);
  });

  it('rejects an invalid member name without persistence', async () => {
    const fixture = createFixture();

    const result = await fixture.handler.handle(
      {
        organizationId: fixture.ids.organizationId.toString(),
        name: '   ',
      },
      fixture.context,
    );

    assert.equal(result.success, false);

    if (result.success) {
      return;
    }

    assert.equal(result.error.code, MemberNameErrorCodes.Empty);
    assert.deepEqual(fixture.members.members, []);
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
    const fixture = createFixture({ outbox: failingOutbox });

    await assert.rejects(
      fixture.handler.handle(
        {
          organizationId: fixture.ids.organizationId.toString(),
          name: 'Maria da Silva',
        },
        fixture.context,
      ),
      (error: unknown) => error === failure,
    );

    assert.equal(received.length, 1);
    assert.equal(fixture.members.members.length, 1);
    assert.equal(fixture.members.members[0]?.pendingDomainEvents.length, 1);
  });
});
