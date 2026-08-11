import assert from 'node:assert/strict';
import { it } from 'node:test';
import { MinistryId } from '@/modules/ministries/domain';
import { OrganizationId } from '@/modules/organizations/domain';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';
import { Activity, ActivityId, ActivityName } from '../domain';
import { mapActivityCreatedIntegrationEvent } from './activity-created-mapper';

function value<T>(result: { success: true; value: T } | { success: false }): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('Invalid deterministic fixture');
  return result.value;
}

it('maps ActivityCreated to its versioned public contract', () => {
  const activity = value(
    Activity.create({
      id: value(ActivityId.create('0198f334-6dc5-7c20-9af1-91d7e599c001')),
      organizationId: value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599c002')),
      name: value(ActivityName.create('Culto de domingo')),
      ministryIds: [value(MinistryId.create('0198f334-6dc5-7c20-9af1-91d7e599c003'))],
      eventId: value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599c004')),
      occurredAt: value(Instant.create('2026-08-11T12:00:00.000Z')),
    }),
  );
  const event = activity.pendingDomainEvents[0];
  assert.ok(event);
  const mapped = mapActivityCreatedIntegrationEvent(event);
  assert.equal(mapped.channel, 'servir.activities.events');
  assert.equal(mapped.type, 'servir.activities.activity.created.v1');
  assert.equal(mapped.partitionKey, activity.organizationId.toString());
  assert.equal(mapped.payload.status, 'active');
});
