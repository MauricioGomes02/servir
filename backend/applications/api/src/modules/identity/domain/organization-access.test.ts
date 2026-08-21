import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MemberId } from '@/modules/membership/domain';
import { OrganizationId } from '@/modules/organizations/domain';
import {
  OrganizationAccess,
  OrganizationAccessId,
  OrganizationAccessLinkErrorCodes,
  OrganizationAccessStatuses,
  UserId,
} from '.';

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
    assert.equal(access.memberId, undefined);
    assert.deepEqual(access.pendingDomainEvents, []);
  });

  it('links a member while preserving the access role and status', () => {
    const organizationId = requireValue(
      OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599c702'),
    );
    const access = OrganizationAccess.grantOwner({
      id: requireValue(OrganizationAccessId.create('0198f334-6dc5-7c20-9af1-91d7e599c701')),
      organizationId,
      userId: requireValue(UserId.create('0198f334-6dc5-7c20-9af1-91d7e599c703')),
    });
    const memberId = requireValue(MemberId.create('0198f334-6dc5-7c20-9af1-91d7e599c704'));

    assert.deepEqual(access.linkMember({ memberId, organizationId }), {
      success: true,
      value: undefined,
    });
    assert.equal(access.memberId?.equals(memberId), true);
    assert.equal(access.role, 'owner');
    assert.equal(access.status, 'active');
  });

  it('rejects replacing an existing member link without mutating it', () => {
    const organizationId = requireValue(
      OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599c702'),
    );
    const firstMemberId = requireValue(MemberId.create('0198f334-6dc5-7c20-9af1-91d7e599c704'));
    const access = OrganizationAccess.reconstitute({
      id: requireValue(OrganizationAccessId.create('0198f334-6dc5-7c20-9af1-91d7e599c701')),
      memberId: firstMemberId,
      organizationId,
      role: 'owner',
      status: OrganizationAccessStatuses.Active,
      userId: requireValue(UserId.create('0198f334-6dc5-7c20-9af1-91d7e599c703')),
    });

    const result = access.linkMember({
      memberId: requireValue(MemberId.create('0198f334-6dc5-7c20-9af1-91d7e599c705')),
      organizationId,
    });

    assert.deepEqual(result, {
      success: false,
      error: { code: OrganizationAccessLinkErrorCodes.UserAlreadyLinkedToAnotherMember },
    });
    assert.equal(access.memberId?.equals(firstMemberId), true);
  });

  it('rejects a member from another organization', () => {
    const organizationId = requireValue(
      OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599c702'),
    );
    const access = OrganizationAccess.grantOwner({
      id: requireValue(OrganizationAccessId.create('0198f334-6dc5-7c20-9af1-91d7e599c701')),
      organizationId,
      userId: requireValue(UserId.create('0198f334-6dc5-7c20-9af1-91d7e599c703')),
    });

    const result = access.linkMember({
      memberId: requireValue(MemberId.create('0198f334-6dc5-7c20-9af1-91d7e599c704')),
      organizationId: requireValue(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599c799')),
    });

    assert.deepEqual(result, {
      success: false,
      error: { code: OrganizationAccessLinkErrorCodes.DifferentOrganization },
    });
    assert.equal(access.memberId, undefined);
  });

  it('rejects a non-canonical access identity', () => {
    const result = OrganizationAccessId.create('access-id');
    assert.deepEqual(result, {
      success: false,
      error: { code: 'identity.organization_access_id.invalid', field: 'organizationAccessId' },
    });
  });
});
