import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { MemberAccessInvitationTokenDigest, MemberAccessInvitationTokenDigestErrorCodes } from '.';

describe('MemberAccessInvitationTokenDigest', () => {
  it('represents a lowercase SHA-256 digest', () => {
    const value = 'a'.repeat(64);
    const result = MemberAccessInvitationTokenDigest.create(value);

    assert.equal(result.success, true);
    if (!result.success) return;
    const sameDigest = MemberAccessInvitationTokenDigest.create(value);
    assert.equal(sameDigest.success, true);
    if (!sameDigest.success) return;

    assert.equal(result.value.toString(), value);
    assert.equal(result.value.equals(sameDigest.value), true);
  });

  it('rejects a digest with an invalid type', () => {
    assert.deepEqual(MemberAccessInvitationTokenDigest.create(123), {
      success: false,
      error: {
        code: MemberAccessInvitationTokenDigestErrorCodes.InvalidType,
        field: 'tokenDigest',
      },
    });
  });

  it('rejects non-canonical digest formats', () => {
    for (const input of ['a'.repeat(63), 'a'.repeat(65), 'A'.repeat(64), 'g'.repeat(64)]) {
      assert.deepEqual(MemberAccessInvitationTokenDigest.create(input), {
        success: false,
        error: {
          code: MemberAccessInvitationTokenDigestErrorCodes.InvalidFormat,
          field: 'tokenDigest',
        },
      });
    }
  });
});
