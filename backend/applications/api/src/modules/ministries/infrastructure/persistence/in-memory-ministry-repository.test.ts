import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { OrganizationId } from '@/modules/organizations/domain';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';
import { Ministry, MinistryCreationPolicyErrorCodes, MinistryId } from '../../domain';
import { InMemoryMinistryRepository } from './in-memory-ministry-repository';

function value<T>(result: { success: true; value: T } | { success: false }): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('Invalid deterministic fixture');
  return result.value;
}

function ministry(id: string, name: string) {
  return value(Ministry.create({
    id: value(MinistryId.create(id)),
    organizationId: value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599e030')),
    name,
    eventId: value(parseDomainEventId(id)),
    occurredAt: value(Instant.create('2026-08-06T12:00:00.000Z')),
  }));
}

describe('InMemoryMinistryRepository', () => {
  it('rejects a second active name ignoring case without changing stored state', async () => {
    const repository = new InMemoryMinistryRepository();
    assert.equal((await repository.add(ministry('0198f334-6dc5-7c20-9af1-91d7e599e031', 'Louvor'))).success, true);
    const duplicate = await repository.add(ministry('0198f334-6dc5-7c20-9af1-91d7e599e032', 'louvor'));
    assert.equal(duplicate.success, false);
    if (!duplicate.success) assert.equal(duplicate.error.code, MinistryCreationPolicyErrorCodes.ActiveNameAlreadyExists);
    assert.equal(repository.ministries.length, 1);
  });

  it('preserves accents when comparing active names', async () => {
    const repository = new InMemoryMinistryRepository();
    await repository.add(ministry('0198f334-6dc5-7c20-9af1-91d7e599e033', 'Mídia'));
    assert.equal((await repository.add(ministry('0198f334-6dc5-7c20-9af1-91d7e599e034', 'Midia'))).success, true);
    assert.equal(repository.ministries.length, 2);
  });
});
