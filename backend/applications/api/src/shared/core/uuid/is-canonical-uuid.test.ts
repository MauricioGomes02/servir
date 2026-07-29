import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isCanonicalUuid } from '.';

describe('isCanonicalUuid', () => {
  it('accepts canonical UUIDs with recognized versions', () => {
    assert.equal(
      isCanonicalUuid('0198f334-6dc5-7c20-9af1-91d7e599c7b1'),
      true,
    );
  });

  it('rejects non-canonical and unsupported UUID representations', () => {
    const invalidValues = [
      'organization-123',
      '0198f3346dc57c209af191d7e599c7b1',
      '{0198f334-6dc5-7c20-9af1-91d7e599c7b1}',
      '0198f334-6dc5-0c20-9af1-91d7e599c7b1',
      '0198f334-6dc5-7c20-0af1-91d7e599c7b1',
    ];

    for (const value of invalidValues) {
      assert.equal(isCanonicalUuid(value), false);
    }
  });
});
