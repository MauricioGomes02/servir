import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MinistryId } from '@/modules/ministries/domain';
import { OrganizationId } from '@/modules/organizations/domain';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';

import {
  Activity,
  ActivityCreationErrorCodes,
  ActivityCreationPolicy,
  ActivityId,
  ActivityName,
} from '.';

function value<T>(result: { success: true; value: T } | { success: false }): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('Invalid deterministic fixture');
  return result.value;
}

const organizationId = value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599a001'));
const ministryId = value(MinistryId.create('0198f334-6dc5-7c20-9af1-91d7e599a002'));

describe('Activity', () => {
  it('creates an active activity and records its participating ministries', () => {
    const activity = value(
      Activity.create({
        id: value(ActivityId.create('0198f334-6dc5-7c20-9af1-91d7e599a003')),
        organizationId,
        name: value(ActivityName.create('  Culto   de domingo  ')),
        ministryIds: [ministryId],
        eventId: value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599a004')),
        occurredAt: value(Instant.create('2026-08-11T12:00:00.000Z')),
      }),
    );

    assert.equal(activity.name.toString(), 'Culto de domingo');
    assert.equal(activity.status, 'active');
    assert.deepEqual(activity.ministryIds.map(String), [ministryId.toString()]);
    assert.equal(activity.pendingDomainEvents[0]?.name, 'activity.created');
    assert.deepEqual(activity.pendingDomainEvents[0]?.payload.ministryIds, [ministryId.toString()]);
  });

  it('creates neither activity nor event without participating ministries', () => {
    const result = Activity.create({
      id: value(ActivityId.create('0198f334-6dc5-7c20-9af1-91d7e599a006')),
      organizationId,
      name: value(ActivityName.create('Culto de domingo')),
      ministryIds: [],
      eventId: value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599a007')),
      occurredAt: value(Instant.create('2026-08-11T12:00:00.000Z')),
    });
    assert.equal(result.success, false);
    if (!result.success)
      assert.equal(result.error.code, ActivityCreationErrorCodes.MinistriesRequired);
  });
});

describe('ActivityCreationPolicy', () => {
  it('requires unique active ministries from the organization', () => {
    const facts = {
      organizationExists: true,
      activeNameExists: false,
      activeMinistryIds: new Set([ministryId.toString()]),
    };
    const duplicate = new ActivityCreationPolicy().validateParticipants([ministryId, ministryId]);
    assert.equal(duplicate.success, false);
    if (!duplicate.success)
      assert.equal(duplicate.error.code, ActivityCreationErrorCodes.DuplicateMinistry);

    const absent = value(MinistryId.create('0198f334-6dc5-7c20-9af1-91d7e599a005'));
    const inactive = new ActivityCreationPolicy().evaluate(facts, [absent]);
    assert.equal(inactive.success, false);
    if (!inactive.success)
      assert.equal(inactive.error.code, ActivityCreationErrorCodes.MinistryNotActive);
  });

  it('requires at least one participating ministry', () => {
    const result = new ActivityCreationPolicy().validateParticipants([]);
    assert.equal(result.success, false);
    if (!result.success)
      assert.equal(result.error.code, ActivityCreationErrorCodes.MinistriesRequired);
  });
});
