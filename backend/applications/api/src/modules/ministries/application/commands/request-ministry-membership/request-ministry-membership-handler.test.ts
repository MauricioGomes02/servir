import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
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
import {
  MinistryId,
  MinistryMembershipId,
  MinistryMembershipRequestPolicy,
  MinistryMembershipRequestPolicyErrorCodes,
} from '../../../domain';
import { InMemoryMinistryMembershipRepository } from '@/composition/test-support';
import { RequestMinistryMembershipHandler } from '.';

function value<T>(result: { success: true; value: T } | { success: false }): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('fixture');
  return result.value;
}
function fixture(
  facts = { memberIsActive: true, ministryIsActive: true, currentMembershipExists: false },
) {
  const organizationId = value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599e210'));
  const ministryId = value(MinistryId.create('0198f334-6dc5-7c20-9af1-91d7e599e211'));
  const memberId = value(MemberId.create('0198f334-6dc5-7c20-9af1-91d7e599e212'));
  const memberships = new InMemoryMinistryMembershipRepository();
  const outbox = new InMemoryEventOutbox();
  const handler = new RequestMinistryMembershipHandler({
    clock: new FixedClock(value(Instant.create('2026-08-07T12:00:00.000Z'))),
    ministryMembershipIdGenerator: new SequenceIdGenerator([
      value(MinistryMembershipId.create('0198f334-6dc5-7c20-9af1-91d7e599e213')),
    ]),
    domainEventIdGenerator: new SequenceIdGenerator([
      value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599e214')),
    ]),
    messageIdGenerator: new SequenceIdGenerator([
      value(parseMessageId('0198f334-6dc5-7c20-9af1-91d7e599e215')),
    ]),
    facts: {
      async findFor() {
        return facts;
      },
    },
    policy: new MinistryMembershipRequestPolicy(),
    unitOfWork: new DirectUnitOfWork({
      ministryMemberships: memberships,
      ministryRoleQualificationFacts: { isRoleActive: async () => false },
      outbox,
    }),
    logger: new InMemoryLogger(),
  });
  return {
    handler,
    organizationId,
    ministryId,
    memberId,
    memberships,
    outbox,
    context: createExecutionContext({
      correlationId: value(parseCorrelationId('correlation-123')),
    }),
  };
}
describe('RequestMinistryMembershipHandler', () => {
  it('persists the requested membership and envelope in the same scope', async () => {
    const f = fixture();
    const result = await f.handler.handle(
      {
        organizationId: f.organizationId.toString(),
        ministryId: f.ministryId.toString(),
        memberId: f.memberId.toString(),
      },
      f.context,
    );
    assert.equal(result.success, true);
    assert.equal(f.memberships.memberships.length, 1);
    assert.equal(f.outbox.envelopes[0]?.event.name, 'ministry_membership.requested');
    assert.equal(f.memberships.memberships[0]?.pendingDomainEvents.length, 0);
  });
  it('rejects an absent member without persistence', async () => {
    const f = fixture({
      memberIsActive: false,
      ministryIsActive: true,
      currentMembershipExists: false,
    });
    const result = await f.handler.handle(
      {
        organizationId: f.organizationId.toString(),
        ministryId: f.ministryId.toString(),
        memberId: f.memberId.toString(),
      },
      f.context,
    );
    assert.equal(
      result.success ? undefined : result.error.code,
      MinistryMembershipRequestPolicyErrorCodes.MemberNotFound,
    );
    assert.equal(f.memberships.memberships.length, 0);
    assert.equal(f.outbox.envelopes.length, 0);
  });
});
