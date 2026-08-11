import assert from 'node:assert/strict';
import { it } from 'node:test';
import { AvailabilityRequest } from '../domain';
import { AvailabilityRequestId } from '../domain';
import { MinistryTeamId } from '@/modules/ministries/domain';
import { OrganizationId } from '@/modules/organizations/domain';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';
import { CivilDate, SchedulePeriod } from '@/shared/domain/temporal';
import { mapAvailabilityRequestOpenedIntegrationEvent } from './availability-request-opened-mapper';

function value<T>(result: { success: true; value: T } | { success: false }): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('Invalid deterministic fixture');
  return result.value;
}

it('maps AvailabilityRequestOpened to its versioned public contract', () => {
  const request = value(
    AvailabilityRequest.open({
      id: value(AvailabilityRequestId.create('0198f334-6dc5-7c20-9af1-91d7e59b0031')),
      organizationId: value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e59b0032')),
      ministryTeamId: value(MinistryTeamId.create('0198f334-6dc5-7c20-9af1-91d7e59b0033')),
      period: value(
        SchedulePeriod.create(
          value(CivilDate.create('2026-09-01')),
          value(CivilDate.create('2026-09-30')),
        ),
      ),
      respondBy: value(Instant.create('2026-08-25T23:59:59.000Z')),
      eventId: value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e59b0034')),
      occurredAt: value(Instant.create('2026-08-11T12:00:00.000Z')),
    }),
  );
  const event = request.pendingDomainEvents[0];
  assert.ok(event);
  const mapped = mapAvailabilityRequestOpenedIntegrationEvent(event);
  assert.equal(mapped.channel, 'servir.availability.events');
  assert.equal(mapped.type, 'servir.availability.availability-request.opened.v1');
  assert.equal(mapped.partitionKey, request.organizationId.toString());
});
