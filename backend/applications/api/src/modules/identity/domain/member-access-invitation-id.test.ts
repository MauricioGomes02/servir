import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { MemberAccessInvitationId, MemberAccessInvitationIdErrorCodes } from '.';

describe('MemberAccessInvitationId', () => {
  const UUID_V7 = '0198f334-6dc5-7c20-9af1-91d7e599d001';

  it('normalizes a canonical UUID identity', () => {
    const result = MemberAccessInvitationId.create(` ${UUID_V7.toUpperCase()} `);

    assert.equal(result.success, true);
    if (!result.success) return;

    assert.equal(result.value.toString(), UUID_V7);
    assert.equal(result.value.toJSON(), UUID_V7);
  });

  it('rejects an identity with an invalid type', () => {
    assert.deepEqual(MemberAccessInvitationId.create(123), {
      success: false,
      error: {
        code: MemberAccessInvitationIdErrorCodes.InvalidType,
        field: 'memberAccessInvitationId',
      },
    });
  });

  it('rejects an empty identity', () => {
    assert.deepEqual(MemberAccessInvitationId.create('   '), {
      success: false,
      error: {
        code: MemberAccessInvitationIdErrorCodes.Empty,
        field: 'memberAccessInvitationId',
      },
    });
  });

  it('rejects a non-UUID identity', () => {
    assert.deepEqual(MemberAccessInvitationId.create('invitation-123'), {
      success: false,
      error: {
        code: MemberAccessInvitationIdErrorCodes.InvalidFormat,
        field: 'memberAccessInvitationId',
      },
    });
  });

  it('rejects an identity longer than 128 characters', () => {
    assert.deepEqual(MemberAccessInvitationId.create('a'.repeat(129)), {
      success: false,
      error: {
        code: MemberAccessInvitationIdErrorCodes.TooLong,
        field: 'memberAccessInvitationId',
        params: {
          maxLength: 128,
          actualLength: 129,
        },
      },
    });
  });
});
