import assert from 'node:assert/strict';
import { it } from 'node:test';
import { InMemoryMinistryTeamRepository } from '@/composition/test-support/persistence-doubles';
import { OrganizationId } from '@/modules/organizations/domain';
import { createExecutionContext, parseCorrelationId } from '@/shared/application/context';
import { parseMessageId } from '@/shared/application/messaging';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';
import { FixedClock } from '@/shared/infrastructure/clock';
import { SequenceIdGenerator } from '@/shared/infrastructure/id-generator';
import { InMemoryEventOutbox } from '@/shared/infrastructure/messaging';
import { DirectUnitOfWork } from '@/shared/infrastructure/unit-of-work';
import { MinistryId, MinistryTeamCreationPolicy, MinistryTeamId } from '../../../domain';
import { CreateMinistryTeamHandler } from './create-ministry-team-handler';
function value<T>(result: { success: true; value: T } | { success: false }): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('Invalid fixture');
  return result.value;
}
it('persists the active ministry team and envelope in the same scope', async () => {
  const teams = new InMemoryMinistryTeamRepository();
  const outbox = new InMemoryEventOutbox();
  const handler = new CreateMinistryTeamHandler({
    clock: new FixedClock(value(Instant.create('2026-08-10T12:00:00.000Z'))),
    ministryTeamIdGenerator: new SequenceIdGenerator([
      value(MinistryTeamId.create('0198f334-6dc5-7c20-9af1-91d7e599fd01')),
    ]),
    domainEventIdGenerator: new SequenceIdGenerator([
      value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599fd02')),
    ]),
    messageIdGenerator: new SequenceIdGenerator([
      value(parseMessageId('0198f334-6dc5-7c20-9af1-91d7e599fd03')),
    ]),
    facts: { find: async () => ({ ministryIsActive: true, activeNameExists: false }) },
    policy: new MinistryTeamCreationPolicy(),
    unitOfWork: new DirectUnitOfWork({ ministryTeams: teams, outbox }),
  });
  const result = await handler.handle(
    {
      organizationId: value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599fd04')).value,
      ministryId: value(MinistryId.create('0198f334-6dc5-7c20-9af1-91d7e599fd05')).value,
      name: 'Louvor A',
    },
    createExecutionContext({ correlationId: value(parseCorrelationId('create-ministry-team')) }),
  );
  assert.equal(result.success, true);
  assert.equal(teams.teams.length, 1);
  assert.equal(outbox.envelopes[0]?.event.name, 'ministry_team.created');
});
