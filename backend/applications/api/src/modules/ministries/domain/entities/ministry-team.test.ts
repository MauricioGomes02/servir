import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { OrganizationId } from '@/modules/organizations/domain';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';
import { MinistryId, MinistryTeam, MinistryTeamId } from '.';
function value<T>(result: { success: true; value: T } | { success: false }): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('Invalid fixture');
  return result.value;
}
describe('MinistryTeam', () => {
  it('creates an active team and records the occurred fact', () => {
    const result = MinistryTeam.create({
      id: value(MinistryTeamId.create('0198f334-6dc5-7c20-9af1-91d7e599fb01')),
      organizationId: value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599fb02')),
      ministryId: value(MinistryId.create('0198f334-6dc5-7c20-9af1-91d7e599fb03')),
      name: ' Louvor   A ',
      eventId: value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599fb04')),
      occurredAt: value(Instant.create('2026-08-10T12:00:00.000Z')),
    });
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.value.name.toString(), 'Louvor A');
    assert.equal(result.value.status, 'active');
    assert.equal(result.value.pendingDomainEvents[0]?.name, 'ministry_team.created');
  });
  it('rejects an empty name without creating a team', () => {
    const result = MinistryTeam.create({
      id: value(MinistryTeamId.create('0198f334-6dc5-7c20-9af1-91d7e599fb11')),
      organizationId: value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599fb12')),
      ministryId: value(MinistryId.create('0198f334-6dc5-7c20-9af1-91d7e599fb13')),
      name: ' ',
      eventId: value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599fb14')),
      occurredAt: value(Instant.create('2026-08-10T12:00:00.000Z')),
    });
    assert.equal(result.success, false);
  });
});
