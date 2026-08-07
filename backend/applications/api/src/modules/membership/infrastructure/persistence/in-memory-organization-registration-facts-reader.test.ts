import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { OrganizationId } from '@/modules/organizations/domain';

import { InMemoryOrganizationRegistrationFactsReader } from './in-memory-organization-registration-facts-reader';

function organizationId(value: string): OrganizationId {
  const result = OrganizationId.create(value);

  if (!result.success) {
    throw new Error('Invalid deterministic organization ID');
  }

  return result.value;
}

describe('InMemoryOrganizationRegistrationFactsReader', () => {
  it('reads organizations added to a live source after construction', async () => {
    const organizations: OrganizationId[] = [];
    const expected = organizationId('0198f334-6dc5-7c20-9af1-91d7e599c7b1');
    const reader = new InMemoryOrganizationRegistrationFactsReader(() => organizations);

    assert.equal(await reader.findById(expected), undefined);

    organizations.push(expected);

    assert.deepEqual(await reader.findById(expected), {
      organizationId: expected,
    });
  });
});
