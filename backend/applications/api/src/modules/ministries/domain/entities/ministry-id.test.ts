import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MinistryId, MinistryIdErrorCodes } from '.';

describe('MinistryId', () => {
  const UUID = '0198f334-6dc5-7c20-9af1-91d7e599e001';

  it('normalizes a canonical UUID identity', () => {
    const result = MinistryId.create(` ${UUID.toUpperCase()} `);
    assert.equal(result.success, true);
    if (result.success) assert.equal(result.value.toString(), UUID);
  });

  it('rejects invalid identity equivalence classes', () => {
    assert.equal(MinistryId.create(null).success, false);
    assert.equal(MinistryId.create(' ').success, false);
    assert.deepEqual(MinistryId.create('ministry-1'), {
      success: false,
      error: { code: MinistryIdErrorCodes.InvalidFormat, field: 'ministryId' },
    });
    assert.equal(MinistryId.create('a'.repeat(129)).success, false);
  });
});
