import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { MemberId, MemberIdErrorCodes } from '.';

describe('MemberId', () => {
  const UUID_V7 = '0198f334-6dc5-7c20-9af1-91d7e599d7b1';

  it('normalizes a canonical UUID identity', () => {
    const result = MemberId.create(` ${UUID_V7.toUpperCase()} `);

    assert.equal(result.success, true);

    if (!result.success) {
      return;
    }

    assert.equal(result.value.toString(), UUID_V7);
    assert.equal(result.value.toJSON(), UUID_V7);
  });

  it('rejects an identity with an invalid type', () => {
    assert.deepEqual(MemberId.create(123), {
      success: false,
      error: {
        code: MemberIdErrorCodes.InvalidType,
        field: 'memberId',
      },
    });
  });

  it('rejects an empty identity', () => {
    assert.deepEqual(MemberId.create('   '), {
      success: false,
      error: {
        code: MemberIdErrorCodes.Empty,
        field: 'memberId',
      },
    });
  });

  it('rejects a non-UUID identity', () => {
    assert.deepEqual(MemberId.create('member-123'), {
      success: false,
      error: {
        code: MemberIdErrorCodes.InvalidFormat,
        field: 'memberId',
      },
    });
  });

  it('rejects an identity longer than 128 characters', () => {
    assert.deepEqual(MemberId.create('a'.repeat(129)), {
      success: false,
      error: {
        code: MemberIdErrorCodes.TooLong,
        field: 'memberId',
        params: {
          maxLength: 128,
          actualLength: 129,
        },
      },
    });
  });
});
