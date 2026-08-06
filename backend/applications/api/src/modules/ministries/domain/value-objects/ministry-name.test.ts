import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MinistryName, MinistryNameErrorCodes } from '.';

describe('MinistryName', () => {
  it('normalizes a valid name', () => {
    const result = MinistryName.create('  Mídia  ');
    assert.equal(result.success, true);
    if (result.success) assert.equal(result.value.toString(), 'Mídia');
  });
  it('rejects invalid type and empty values', () => {
    assert.equal(MinistryName.create(null).success, false);
    assert.deepEqual(MinistryName.create(' '), { success: false, error: { code: MinistryNameErrorCodes.Empty, field: 'name' } });
  });
  it('accepts 120 characters and rejects 121', () => {
    assert.equal(MinistryName.create('a'.repeat(120)).success, true);
    assert.deepEqual(MinistryName.create('a'.repeat(121)), {
      success: false,
      error: { code: MinistryNameErrorCodes.TooLong, field: 'name', params: { maxLength: 120, actualLength: 121 } },
    });
  });
});
