import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { OrganizationId } from '@/modules/organizations/domain';
import { createExecutionContext, parseCorrelationId } from '@/shared/application/context';
import { parseMessageId, type EventEnvelope } from '@/shared/application/messaging';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';
import { FixedClock } from '@/shared/infrastructure/clock';
import { SequenceIdGenerator } from '@/shared/infrastructure/id-generator';
import { InMemoryLogger } from '@/shared/infrastructure/logging';
import { success } from '@/shared/core/result';
import {
  MinistryCreationPolicy,
  MinistryCreationPolicyErrorCodes,
  MinistryId,
  MinistryName,
  type Ministry,
} from '../../../domain';
import type { MinistryWriteScope } from '../../ports';
import { CreateMinistryHandler } from '.';

function value<T>(result: { success: true; value: T } | { success: false }): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('Invalid deterministic fixture');
  return result.value;
}

function fixture(organizationExists = true) {
  const organizationId = value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599e010'));
  const ministryId = value(MinistryId.create('0198f334-6dc5-7c20-9af1-91d7e599e011'));
  const ministries: Ministry[] = [];
  const envelopes: EventEnvelope[] = [];
  const scope: MinistryWriteScope = {
    ministries: {
      async add(ministry) {
        ministries.push(ministry);
        return success();
      },
      async findById() {
        return undefined;
      },
      async save() {
        return success();
      },
    },
    outbox: {
      async add(received) {
        envelopes.push(...received);
      },
    },
  };
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
    creationFacts: {
      async find(_organizationId, name) {
        return Object.freeze({
          organizationExists,
          activeNameExists: ministries.some(
            (ministry) =>
              ministry.status === 'active' &&
              ministry.name.toString().toLowerCase() === name.toString().toLowerCase(),
          ),
        });
      },
    },
    creationPolicy: new MinistryCreationPolicy(),
    unitOfWork: {
      async execute(work) {
        return work(scope);
      },
    },
    logger,
  });
  return {
    handler,
    organizationId,
    ministryId,
    ministries,
    envelopes,
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
    assert.equal(f.ministries.length, 1);
    assert.equal(f.envelopes.length, 1);
    assert.equal(f.envelopes[0]?.event.name, 'ministry.created');
    assert.deepEqual(f.ministries[0]?.pendingDomainEvents, []);
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
    assert.equal(f.ministries.length, 0);
    assert.equal(f.envelopes.length, 0);
  });

  it('reports an existing active name ignoring case without a second envelope', async () => {
    const f = fixture();
    await f.handler.handle(
      { organizationId: f.organizationId.toString(), name: 'Louvor' },
      f.context,
    );
    const duplicateName = value(MinistryName.create('louvor'));
    const duplicateFacts = Object.freeze({
      organizationExists: true,
      activeNameExists: f.ministries.some(
        (ministry) =>
          ministry.status === 'active' &&
          ministry.name.toString().toLowerCase() === duplicateName.toString().toLowerCase(),
      ),
    });
    const decision = new MinistryCreationPolicy().evaluate(duplicateFacts);
    assert.equal(decision.success, false);
    if (!decision.success)
      assert.equal(decision.error.code, MinistryCreationPolicyErrorCodes.ActiveNameAlreadyExists);
    assert.equal(f.envelopes.length, 1);
  });
});
