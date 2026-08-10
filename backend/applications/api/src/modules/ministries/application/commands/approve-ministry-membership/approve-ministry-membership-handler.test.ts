import assert from 'node:assert/strict';
import { it } from 'node:test';
import { MemberId } from '@/modules/membership/domain';
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
import { MinistryId, MinistryMembership, MinistryMembershipId } from '../../../domain';
import { InMemoryMinistryMembershipRepository } from '@/composition/test-support';
import { ApproveMinistryMembershipHandler } from '.';
function value<T>(result: { success: true; value: T } | { success: false }): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('fixture');
  return result.value;
}
it('persists approval and outbox in the same scope', async () => {
  const organizationId = value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599e241'));
  const ministryId = value(MinistryId.create('0198f334-6dc5-7c20-9af1-91d7e599e242'));
  const membershipId = value(MinistryMembershipId.create('0198f334-6dc5-7c20-9af1-91d7e599e243'));
  const memberships = new InMemoryMinistryMembershipRepository();
  const outbox = new InMemoryEventOutbox();
  const membership = MinistryMembership.request({
    id: membershipId,
    organizationId,
    ministryId,
    memberId: value(MemberId.create('0198f334-6dc5-7c20-9af1-91d7e599e244')),
    eventId: value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599e245')),
    requestedAt: value(Instant.create('2026-08-07T12:00:00.000Z')),
  });
  await memberships.add(membership);
  membership.acknowledgeDomainEvents(membership.pendingDomainEvents);
  const handler = new ApproveMinistryMembershipHandler({
    clock: new FixedClock(value(Instant.create('2026-08-07T13:00:00.000Z'))),
    domainEventIdGenerator: new SequenceIdGenerator([
      value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599e246')),
    ]),
    messageIdGenerator: new SequenceIdGenerator([
      value(parseMessageId('0198f334-6dc5-7c20-9af1-91d7e599e247')),
    ]),
    unitOfWork: new DirectUnitOfWork({
      ministryMemberships: memberships,
      ministryRoleQualificationFacts: { isRoleActive: async () => false },
      outbox,
    }),
    logger: new InMemoryLogger(),
  });
  const result = await handler.handle(
    {
      organizationId: organizationId.value,
      ministryId: ministryId.value,
      ministryMembershipId: membershipId.value,
    },
    createExecutionContext({ correlationId: value(parseCorrelationId('correlation-123')) }),
  );
  assert.equal(result.success, true);
  assert.equal(membership.status, 'active');
  assert.equal(outbox.envelopes[0]?.event.name, 'ministry_membership.approved');
  assert.equal(membership.pendingDomainEvents.length, 0);
});
