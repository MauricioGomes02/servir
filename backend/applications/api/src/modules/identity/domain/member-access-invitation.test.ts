import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MemberId } from '@/modules/membership/domain';
import { OrganizationId } from '@/modules/organizations/domain';
import { Instant } from '@/shared/domain/instant';
import {
  MemberAccessInvitation,
  MemberAccessInvitationErrorCodes,
  MemberAccessInvitationId,
  MemberAccessInvitationStatuses,
  MemberAccessInvitationTokenDigest,
} from '.';

function value<T>(result: { success: true; value: T } | { success: false }): T {
  if (!result.success) throw new Error('invalid deterministic fixture');
  return result.value;
}

const now = value(Instant.create('2026-08-20T12:00:00.000Z'));
const expiresAt = value(Instant.create('2026-08-27T12:00:00.000Z'));

function invite() {
  return MemberAccessInvitation.invite({
    expiresAt,
    id: value(MemberAccessInvitationId.create('0198f334-6dc5-7c20-9af1-91d7e599d001')),
    memberId: value(MemberId.create('0198f334-6dc5-7c20-9af1-91d7e599d002')),
    now,
    organizationId: value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599d003')),
    tokenDigest: value(MemberAccessInvitationTokenDigest.create('a'.repeat(64))),
  });
}

describe('MemberAccessInvitation', () => {
  it('creates a pending invitation with a digest and future expiration', () => {
    const result = invite();
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.value.status, MemberAccessInvitationStatuses.Pending);
    assert.equal(result.value.tokenDigest.toString(), 'a'.repeat(64));
    assert.equal(result.value.expiresAt.equals(expiresAt), true);
  });

  it('rejects an expiration that is not after creation time', () => {
    const result = MemberAccessInvitation.invite({
      expiresAt: now,
      id: value(MemberAccessInvitationId.create('0198f334-6dc5-7c20-9af1-91d7e599d001')),
      memberId: value(MemberId.create('0198f334-6dc5-7c20-9af1-91d7e599d002')),
      now,
      organizationId: value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599d003')),
      tokenDigest: value(MemberAccessInvitationTokenDigest.create('a'.repeat(64))),
    });
    assert.deepEqual(result, {
      success: false,
      error: {
        code: MemberAccessInvitationErrorCodes.ExpirationInvalid,
        field: 'expiresAt',
      },
    });
  });

  it('accepts once and rejects reuse', () => {
    const result = invite();
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.value.accept(now).success, true);
    assert.equal(result.value.status, MemberAccessInvitationStatuses.Accepted);
    assert.deepEqual(result.value.accept(now), {
      success: false,
      error: { code: MemberAccessInvitationErrorCodes.AlreadyConsumed },
    });
  });

  it('rejects an expired invitation at the exact expiration boundary', () => {
    const result = invite();
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.deepEqual(result.value.accept(expiresAt), {
      success: false,
      error: { code: MemberAccessInvitationErrorCodes.Expired },
    });
    assert.equal(result.value.status, MemberAccessInvitationStatuses.Pending);
  });

  it('rejects a revoked invitation without changing its state', () => {
    const result = invite();
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.value.revoke().success, true);
    assert.deepEqual(result.value.accept(now), {
      success: false,
      error: { code: MemberAccessInvitationErrorCodes.Revoked },
    });
    assert.equal(result.value.status, MemberAccessInvitationStatuses.Revoked);
  });
});
