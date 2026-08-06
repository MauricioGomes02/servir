import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { OrganizationId } from '@/modules/organizations/domain';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';
import { Ministry, MinistryId } from '.';
import { MinistryNameErrorCodes } from '../value-objects';

function value<T>(result: { success: true; value: T } | { success: false }): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('Invalid deterministic fixture');
  return result.value;
}

describe('Ministry', () => {
  it('creates an active ministry and records the occurred fact', () => {
    const id = value(MinistryId.create('0198f334-6dc5-7c20-9af1-91d7e599e001'));
    const organizationId = value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599e002'));
    const eventId = value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599e003'));
    const occurredAt = value(Instant.create('2026-08-06T12:00:00.000Z'));
    const result = Ministry.create({ id, organizationId, name: '  Louvor  ', eventId, occurredAt });
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.value.status, 'active');
    assert.equal(result.value.organizationId, organizationId);
    assert.equal(result.value.name.toString(), 'Louvor');
    assert.deepEqual(result.value.pendingDomainEvents[0]?.payload, {
      ministryId: id.toString(), organizationId: organizationId.toString(), name: 'Louvor',
    });
  });

  it('creates neither ministry nor fact when the name is invalid', () => {
    const result = Ministry.create({
      id: value(MinistryId.create('0198f334-6dc5-7c20-9af1-91d7e599e001')),
      organizationId: value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599e002')),
      name: ' ',
      eventId: value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599e003')),
      occurredAt: value(Instant.create('2026-08-06T12:00:00.000Z')),
    });
    assert.deepEqual(result, { success: false, error: { code: MinistryNameErrorCodes.Empty, field: 'name' } });
  });
});
