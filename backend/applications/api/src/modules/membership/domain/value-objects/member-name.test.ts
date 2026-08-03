import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  MemberName,
  MemberNameErrorCodes,
} from '.';

describe('MemberName', () => {
  it('normalizes and represents a valid name', () => {
    const result = MemberName.create('  Maria da Silva  ');

    assert.equal(result.success, true);

    if (!result.success) {
      return;
    }

    assert.equal(result.value.toString(), 'Maria da Silva');
    assert.equal(result.value.toJSON(), 'Maria da Silva');
  });

  it('rejects a name with an invalid type', () => {
    assert.deepEqual(MemberName.create(null), {
      success: false,
      error: {
        code: MemberNameErrorCodes.InvalidType,
        field: 'name',
      },
    });
  });

  it('rejects an empty name', () => {
    assert.deepEqual(MemberName.create('   '), {
      success: false,
      error: {
        code: MemberNameErrorCodes.Empty,
        field: 'name',
      },
    });
  });

  it('accepts a name with exactly 120 characters', () => {
    const input = 'a'.repeat(120);
    const result = MemberName.create(input);

    assert.equal(result.success, true);

    if (!result.success) {
      return;
    }

    assert.equal(result.value.toString(), input);
  });

  it('rejects a name longer than 120 characters', () => {
    assert.deepEqual(MemberName.create('a'.repeat(121)), {
      success: false,
      error: {
        code: MemberNameErrorCodes.TooLong,
        field: 'name',
        params: {
          maxLength: 120,
          actualLength: 121,
        },
      },
    });
  });
});
