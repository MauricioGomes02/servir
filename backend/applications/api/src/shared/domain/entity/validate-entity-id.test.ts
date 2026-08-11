import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateEntityId } from './validate-entity-id';

const codes = {
  InvalidType: 'id.invalid_type',
  Empty: 'id.empty',
  TooLong: 'id.too_long',
  InvalidFormat: 'id.invalid_format',
} as const;

describe('validateEntityId', () => {
  it('normalizes a canonical UUID and classifies every invalid input boundary', () => {
    assert.deepEqual(validateEntityId(' 0198F334-6DC5-7C20-9AF1-91D7E599C7B1 ', 'id', codes), {
      success: true,
      value: '0198f334-6dc5-7c20-9af1-91d7e599c7b1',
    });
    assert.equal(validateEntityId(undefined, 'id', codes).success, false);
    assert.equal(validateEntityId(' ', 'id', codes).success, false);
    assert.equal(validateEntityId('x'.repeat(129), 'id', codes).success, false);
    assert.equal(validateEntityId('invalid', 'id', codes).success, false);
  });
});
