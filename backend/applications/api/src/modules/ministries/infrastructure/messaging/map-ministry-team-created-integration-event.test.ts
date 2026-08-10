import assert from 'node:assert/strict';
import { it } from 'node:test';
import { OrganizationId } from '@/modules/organizations/domain';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';
import {
  createMinistryTeamCreated,
  MinistryId,
  MinistryTeamId,
  MinistryTeamName,
} from '../../domain';
import { mapMinistryTeamCreatedIntegrationEvent } from './map-ministry-team-created-integration-event';
function value<T>(result: { success: true; value: T } | { success: false }): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('Invalid fixture');
  return result.value;
}
it('maps a ministry team creation to the versioned public contract', () => {
  const mapped = mapMinistryTeamCreatedIntegrationEvent(
    createMinistryTeamCreated({
      eventId: value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599fc01')),
      occurredAt: value(Instant.create('2026-08-10T12:00:00.000Z')),
      ministryTeamId: value(MinistryTeamId.create('0198f334-6dc5-7c20-9af1-91d7e599fc02')),
      organizationId: value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599fc03')),
      ministryId: value(MinistryId.create('0198f334-6dc5-7c20-9af1-91d7e599fc04')),
      name: value(MinistryTeamName.create('Louvor A')),
    }),
  );
  assert.equal(mapped.type, 'servir.ministries.ministry-team.created.v1');
  assert.equal(mapped.payload.status, 'active');
});
