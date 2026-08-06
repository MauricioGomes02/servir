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
import { Ministry, MinistryId, MinistryRoleDefinitionErrorCodes, MinistryRoleId } from '../../../domain';
import { InMemoryMinistryRepository } from '../../../infrastructure';
import { DefineMinistryRoleErrorCodes, DefineMinistryRoleHandler } from '.';

function value<T>(result: { success: true; value: T } | { success: false }): T { assert.equal(result.success, true); if (!result.success) throw new Error('fixture'); return result.value; }
async function fixture(withMinistry = true) {
  const organizationId = value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599e120'));
  const ministryId = value(MinistryId.create('0198f334-6dc5-7c20-9af1-91d7e599e121'));
  const repository = new InMemoryMinistryRepository();
  if (withMinistry) {
    const ministry = value(Ministry.create({
      id: ministryId, organizationId, name: 'Louvor',
      eventId: value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599e122')),
      occurredAt: value(Instant.create('2026-08-06T15:00:00.000Z')),
    }));
    ministry.acknowledgeDomainEvents(ministry.pendingDomainEvents);
    await repository.add(ministry);
  }
  const outbox = new InMemoryEventOutbox();
  const handler = new DefineMinistryRoleHandler({
    clock: new FixedClock(value(Instant.create('2026-08-06T15:01:00.000Z'))),
    ministryRoleIdGenerator: new SequenceIdGenerator([
      value(MinistryRoleId.create('0198f334-6dc5-7c20-9af1-91d7e599e123')),
      value(MinistryRoleId.create('0198f334-6dc5-7c20-9af1-91d7e599e126')),
    ]),
    domainEventIdGenerator: new SequenceIdGenerator([
      value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599e124')),
      value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599e127')),
    ]),
    messageIdGenerator: new SequenceIdGenerator([value(parseMessageId('0198f334-6dc5-7c20-9af1-91d7e599e125'))]),
    unitOfWork: new DirectUnitOfWork({ ministries: repository, outbox }), logger: new InMemoryLogger(),
  });
  return { handler, repository, outbox, organizationId, ministryId,
    context: createExecutionContext({ correlationId: value(parseCorrelationId('role-correlation')) }) };
}

describe('DefineMinistryRoleHandler', () => {
  it('persists the role and outbox then acknowledges the event', async () => {
    const f = await fixture();
    const result = await f.handler.handle({ organizationId: f.organizationId.toString(), ministryId: f.ministryId.toString(), name: 'Vocal' }, f.context);
    assert.equal(result.success, true);
    assert.equal(f.outbox.envelopes.length, 1);
    assert.equal(f.outbox.envelopes[0]?.event.name, 'ministry.role_defined');
    const stored = await f.repository.findById(f.organizationId, f.ministryId);
    assert.equal(stored?.roles[0]?.name.toString(), 'Vocal');
    assert.equal(stored?.pendingDomainEvents.length, 0);
  });

  it('rejects a ministry outside the organization', async () => {
    const f = await fixture(false);
    const result = await f.handler.handle({ organizationId: f.organizationId.toString(), ministryId: f.ministryId.toString(), name: 'Vocal' }, f.context);
    assert.equal(result.success, false);
    if (!result.success) assert.equal(result.error.code, DefineMinistryRoleErrorCodes.MinistryNotFound);
    assert.equal(f.outbox.envelopes.length, 0);
  });

  it('rejects a duplicate active role ignoring case without another outbox message', async () => {
    const f = await fixture();
    await f.handler.handle({ organizationId: f.organizationId.toString(), ministryId: f.ministryId.toString(), name: 'Vocal' }, f.context);
    const duplicate = await f.handler.handle({ organizationId: f.organizationId.toString(), ministryId: f.ministryId.toString(), name: 'vocal' }, f.context);
    assert.equal(duplicate.success, false);
    if (!duplicate.success) assert.equal(duplicate.error.code, MinistryRoleDefinitionErrorCodes.ActiveNameAlreadyExists);
    assert.equal(f.outbox.envelopes.length, 1);
  });
});
