import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { OrganizationId } from '@/modules/organizations/domain';
import { createExecutionContext, parseCorrelationId } from '@/shared/application/context';
import { parseMessageId } from '@/shared/application/messaging';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';
import { FixedClock } from '@/shared/infrastructure/clock';
import { SequenceIdGenerator } from '@/shared/infrastructure/id-generator';
import { InMemoryLogger } from '@/shared/infrastructure/logging';
import { InMemoryEventOutbox } from '@/shared/infrastructure/messaging';
import { DirectUnitOfWork } from '@/shared/infrastructure/unit-of-work';
import {
  MinistryCreationPolicy,
  MinistryCreationPolicyErrorCodes,
  MinistryId,
  MinistryName,
} from '../../../domain';
import {
  InMemoryMinistryCreationFactsReader,
  InMemoryMinistryRepository,
} from '@/composition/test-support';
import { CreateMinistryHandler } from '.';

function value<T>(result: { success: true; value: T } | { success: false }): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('Invalid deterministic fixture');
  return result.value;
}

function fixture(organizationExists = true) {
  const organizationId = value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599e010'));
  const ministryId = value(MinistryId.create('0198f334-6dc5-7c20-9af1-91d7e599e011'));
  const ministries = new InMemoryMinistryRepository();
  const outbox = new InMemoryEventOutbox();
  const logger = new InMemoryLogger();
  const handler = new CreateMinistryHandler({
    clock: new FixedClock(value(Instant.create('2026-08-06T12:00:00.000Z'))),
    ministryIdGenerator: new SequenceIdGenerator([ministryId]),
    domainEventIdGenerator: new SequenceIdGenerator([
      value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599e012')),
    ]),
    messageIdGenerator: new SequenceIdGenerator([
      value(parseMessageId('0198f334-6dc5-7c20-9af1-91d7e599e013')),
    ]),
    creationFacts: new InMemoryMinistryCreationFactsReader(
      () => (organizationExists ? [organizationId] : []),
      () => ministries.ministries,
    ),
    creationPolicy: new MinistryCreationPolicy(),
    unitOfWork: new DirectUnitOfWork({ ministries, outbox }),
    logger,
  });
  return {
    handler,
    organizationId,
    ministryId,
    ministries,
    outbox,
    logger,
    context: createExecutionContext({
      correlationId: value(parseCorrelationId('correlation-123')),
    }),
  };
}

describe('CreateMinistryHandler', () => {
  it('persists the active ministry and envelope in the same scope', async () => {
    const f = fixture();
    const result = await f.handler.handle(
      { organizationId: f.organizationId.toString(), name: 'Louvor' },
      f.context,
    );
    assert.equal(result.success, true);
    assert.equal(f.ministries.ministries.length, 1);
    assert.equal(f.outbox.envelopes.length, 1);
    assert.equal(f.outbox.envelopes[0]?.event.name, 'ministry.created');
    assert.deepEqual(f.ministries.ministries[0]?.pendingDomainEvents, []);
    assert.equal(JSON.stringify(f.logger.records).includes('Louvor'), false);
  });

  it('rejects an unknown organization without persistence', async () => {
    const f = fixture(false);
    const result = await f.handler.handle(
      { organizationId: f.organizationId.toString(), name: 'Louvor' },
      f.context,
    );
    assert.equal(result.success, false);
    if (!result.success)
      assert.equal(result.error.code, MinistryCreationPolicyErrorCodes.OrganizationNotFound);
    assert.equal(f.ministries.ministries.length, 0);
    assert.equal(f.outbox.envelopes.length, 0);
  });

  it('reports an existing active name ignoring case without a second envelope', async () => {
    const f = fixture();
    await f.handler.handle(
      { organizationId: f.organizationId.toString(), name: 'Louvor' },
      f.context,
    );
    const facts = new InMemoryMinistryCreationFactsReader(
      () => [f.organizationId],
      () => f.ministries.ministries,
    );
    const duplicateFacts = await facts.find(f.organizationId, value(MinistryName.create('louvor')));
    const decision = new MinistryCreationPolicy().evaluate(duplicateFacts);
    assert.equal(decision.success, false);
    if (!decision.success)
      assert.equal(decision.error.code, MinistryCreationPolicyErrorCodes.ActiveNameAlreadyExists);
    assert.equal(f.outbox.envelopes.length, 1);
  });
});
