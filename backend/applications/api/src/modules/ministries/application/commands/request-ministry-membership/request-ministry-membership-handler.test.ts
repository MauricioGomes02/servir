import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MemberId } from '@/modules/membership/domain';
import { OrganizationId } from '@/modules/organizations/domain';
import { createExecutionContext, parseCorrelationId } from '@/shared/application/context';
import { parseMessageId, type EventEnvelope } from '@/shared/application/messaging';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';
import { FixedClock } from '@/shared/infrastructure/clock';
import { SequenceIdGenerator } from '@/shared/infrastructure/id-generator';
import { InMemoryLogger } from '@/shared/infrastructure/logging';
import {
  MinistryId,
  MinistryMembershipId,
  MinistryMembershipRequestPolicy,
  MinistryMembershipRequestPolicyErrorCodes,
  type MinistryMembership,
} from '../../../domain';
import type { MinistryMembershipWriteScope } from '../../ports';
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
  const memberships: MinistryMembership[] = [];
  const envelopes: EventEnvelope[] = [];
  const steps: string[] = [];
  const scope: MinistryMembershipWriteScope = {
    membershipRequestFacts: {
      async findFor() {
        steps.push('facts');
        return facts;
      },
    },
    ministryMemberships: {
      async add(membership) {
        steps.push('add');
        memberships.push(membership);
      },
      async findById() {
        return undefined;
      },
      async save() {},
    },
    ministryRoleQualificationFacts: { isRoleActive: async () => false },
    writeLock: {
      async acquireMembership() {},
      async acquireRequest() {
        steps.push('lock');
      },
    },
    outbox: {
      async add(received) {
        envelopes.push(...received);
      },
    },
  };
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
    policy: new MinistryMembershipRequestPolicy(),
    unitOfWork: {
      async execute(work) {
        return work(scope);
      },
    },
    logger: new InMemoryLogger(),
  });
  return {
    handler,
    organizationId,
    ministryId,
    memberId,
    memberships,
    envelopes,
    steps,
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
    assert.equal(f.memberships.length, 1);
    assert.equal(f.envelopes[0]?.event.name, 'ministry_membership.requested');
    assert.equal(f.memberships[0]?.pendingDomainEvents.length, 0);
    assert.deepEqual(f.steps, ['lock', 'facts', 'add']);
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
    assert.equal(f.memberships.length, 0);
    assert.equal(f.envelopes.length, 0);
  });
});
