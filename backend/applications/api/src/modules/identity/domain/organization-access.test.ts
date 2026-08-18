import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { OrganizationId } from '@/modules/organizations/domain';
import { OrganizationAccess, OrganizationAccessId, UserId } from '.';

function requireValue<T>(result: { success: true; value: T } | { success: false }): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('invalid deterministic fixture');
  return result.value;
}

describe('OrganizationAccess', () => {
  it('grants active owner access without linking a member', () => {
    const access = OrganizationAccess.grantOwner({
      id: requireValue(OrganizationAccessId.create('0198f334-6dc5-7c20-9af1-91d7e599c701')),
      organizationId: requireValue(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599c702')),
      userId: requireValue(UserId.create('0198f334-6dc5-7c20-9af1-91d7e599c703')),
    });

    assert.equal(access.role, 'owner');
    assert.equal(access.status, 'active');
    assert.deepEqual(access.pendingDomainEvents, []);
  });

  it('rejects a non-canonical access identity', () => {
    const result = OrganizationAccessId.create('access-id');
    assert.deepEqual(result, {
      success: false,
      error: { code: 'identity.organization_access_id.invalid', field: 'organizationAccessId' },
    });
  });
});
