import assert from 'node:assert/strict';
import { it } from 'node:test';
import { MinistryTeamId } from '@/modules/ministries/domain';
import { OrganizationId } from '@/modules/organizations/domain';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';
import { CivilDate, SchedulePeriod } from '@/shared/domain/temporal';
import { AvailabilityRequest, AvailabilityRequestId } from './availability-request';

function value<T>(result: { success: true; value: T } | { success: false }): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('Invalid deterministic fixture');
  return result.value;
}

it('opens an availability request and records its civil period and deadline', () => {
  const request = value(
    AvailabilityRequest.open({
      id: value(AvailabilityRequestId.create('0198f334-6dc5-7c20-9af1-91d7e59b0001')),
      organizationId: value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e59b0002')),
      ministryTeamId: value(MinistryTeamId.create('0198f334-6dc5-7c20-9af1-91d7e59b0003')),
      period: value(
        SchedulePeriod.create(
          value(CivilDate.create('2026-09-01')),
          value(CivilDate.create('2026-09-30')),
        ),
      ),
      respondBy: value(Instant.create('2026-08-25T23:59:59.000Z')),
      eventId: value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e59b0004')),
      occurredAt: value(Instant.create('2026-08-11T12:00:00.000Z')),
    }),
  );

  assert.equal(request.status, 'open');
  assert.equal(request.period.startDate.toISOString(), '2026-09-01');
  assert.equal(request.pendingDomainEvents[0]?.name, 'availability_request.opened');
  assert.equal(request.pendingDomainEvents[0]?.payload.respondBy, '2026-08-25T23:59:59.000Z');
});

it('opens neither request nor event when the deadline is not in the future', () => {
  const result = AvailabilityRequest.open({
    id: value(AvailabilityRequestId.create('0198f334-6dc5-7c20-9af1-91d7e59b0005')),
    organizationId: value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e59b0006')),
    ministryTeamId: value(MinistryTeamId.create('0198f334-6dc5-7c20-9af1-91d7e59b0007')),
    period: value(
      SchedulePeriod.create(
        value(CivilDate.create('2026-09-01')),
        value(CivilDate.create('2026-09-30')),
      ),
    ),
    respondBy: value(Instant.create('2026-08-11T12:00:00.000Z')),
    eventId: value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e59b0008')),
    occurredAt: value(Instant.create('2026-08-11T12:00:00.000Z')),
  });
  assert.equal(result.success, false);
});
