import assert from 'node:assert/strict';
import { it } from 'node:test';
import { InMemoryTeamLeadershipRepository } from '@/composition/test-support/persistence-doubles';
import { OrganizationId } from '@/modules/organizations/domain';
import { createExecutionContext, parseCorrelationId } from '@/shared/application/context';
import { parseMessageId } from '@/shared/application/messaging';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';
import { FixedClock } from '@/shared/infrastructure/clock';
import { SequenceIdGenerator } from '@/shared/infrastructure/id-generator';
import { InMemoryEventOutbox } from '@/shared/infrastructure/messaging';
import { DirectUnitOfWork } from '@/shared/infrastructure/unit-of-work';
import {
  MinistryId,
  MinistryTeamId,
  TeamLeaderAppointmentPolicy,
  TeamLeadershipId,
  TeamMembershipId,
} from '../../../domain';
import { AppointTeamLeaderHandler } from './appoint-team-leader-handler';

function value<T>(result: { success: true; value: T } | { success: false }): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('Invalid fixture');
  return result.value;
}

it('persists the active team leadership and envelope in the same scope', async () => {
  const leaderships = new InMemoryTeamLeadershipRepository();
  const outbox = new InMemoryEventOutbox();
  const handler = new AppointTeamLeaderHandler({
    clock: new FixedClock(value(Instant.create('2026-08-11T12:00:00.000Z'))),
    teamLeadershipIdGenerator: new SequenceIdGenerator([
      value(TeamLeadershipId.create('0198f334-6dc5-7c20-9af1-91d7e599f901')),
    ]),
    domainEventIdGenerator: new SequenceIdGenerator([
      value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599f902')),
    ]),
    messageIdGenerator: new SequenceIdGenerator([
      value(parseMessageId('0198f334-6dc5-7c20-9af1-91d7e599f903')),
    ]),
    facts: {
      find: async () => ({
        teamIsActive: true,
        teamMembershipIsActive: true,
        activeLeadershipExists: false,
      }),
    },
    policy: new TeamLeaderAppointmentPolicy(),
    unitOfWork: new DirectUnitOfWork({ teamLeaderships: leaderships, outbox }),
  });
  const result = await handler.handle(
    {
      organizationId: value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599f904')).value,
      ministryId: value(MinistryId.create('0198f334-6dc5-7c20-9af1-91d7e599f905')).value,
      ministryTeamId: value(MinistryTeamId.create('0198f334-6dc5-7c20-9af1-91d7e599f906')).value,
      teamMembershipId: value(TeamMembershipId.create('0198f334-6dc5-7c20-9af1-91d7e599f907'))
        .value,
    },
    createExecutionContext({ correlationId: value(parseCorrelationId('appoint-team-leader')) }),
  );
  assert.equal(result.success, true);
  assert.equal(leaderships.leaderships.length, 1);
  assert.equal(outbox.envelopes[0]?.event.name, 'team_leader.appointed');
});
