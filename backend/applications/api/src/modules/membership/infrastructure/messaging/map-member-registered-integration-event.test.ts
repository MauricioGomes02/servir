import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { OrganizationId } from '@/modules/organizations/domain';
import {
  createMemberRegistered,
  MemberId,
  MemberName,
} from '@/modules/membership/domain';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';

import { mapMemberRegisteredIntegrationEvent } from './map-member-registered-integration-event';

function requireValue<TValue>(result: Readonly<
  | { success: true; value: TValue }
  | { success: false }
>): TValue {
  assert.equal(result.success, true);

  if (!result.success) {
    throw new Error('Invalid deterministic integration event fixture');
  }

  return result.value;
}

describe('mapMemberRegisteredIntegrationEvent', () => {
  it('creates the versioned public contract with organization partitioning', () => {
    const event = createMemberRegistered({
      eventId: requireValue(parseDomainEventId(
        '0198f334-6dc5-7c20-9af1-91d7e599f001',
      )),
      occurredAt: requireValue(Instant.create(
        '2026-08-04T15:00:00.000Z',
      )),
      memberId: requireValue(MemberId.create(
        '0198f334-6dc5-7c20-9af1-91d7e599f002',
      )),
      organizationId: requireValue(OrganizationId.create(
        '0198f334-6dc5-7c20-9af1-91d7e599f003',
      )),
      name: requireValue(MemberName.create('Maria da Silva')),
    });

    const integrationEvent = mapMemberRegisteredIntegrationEvent(event);

    assert.deepEqual(integrationEvent, {
      channel: 'servir.membership.events',
      source: 'urn:servir:membership',
      type: 'servir.membership.member.registered.v1',
      name: 'member.registered',
      version: 1,
      occurredAt: '2026-08-04T15:00:00.000Z',
      aggregateId: '0198f334-6dc5-7c20-9af1-91d7e599f002',
      partitionKey: '0198f334-6dc5-7c20-9af1-91d7e599f003',
      payload: {
        memberId: '0198f334-6dc5-7c20-9af1-91d7e599f002',
        organizationId: '0198f334-6dc5-7c20-9af1-91d7e599f003',
        name: 'Maria da Silva',
        registeredAt: '2026-08-04T15:00:00.000Z',
      },
      metadata: {},
    });
    assert.equal('eventId' in integrationEvent, false);
    assert.equal(Object.isFrozen(integrationEvent), true);
    assert.equal(Object.isFrozen(integrationEvent.payload), true);
  });
});
