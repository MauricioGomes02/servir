import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createLeaseId,
  LeaseIdError,
  LeaseIdErrorCodes,
} from './lease-id';

describe('LeaseId', () => {
  it('accepts a canonical UUIDv7 identity', () => {
    const value = '0198f334-6dc5-7c20-9af1-91d7e599c001';

    assert.equal(createLeaseId(value), value);
  });

  it('rejects non-string and non-canonical identities', () => {
    for (const value of [undefined, '', 'lease-1', '0198F334-6DC5-7C20-9AF1-91D7E599C001']) {
      assert.throws(
        () => createLeaseId(value),
        (error: unknown) => error instanceof LeaseIdError
          && error.code === LeaseIdErrorCodes.Invalid,
      );
    }
  });

  it('rejects a canonical UUID from another version', () => {
    assert.throws(
      () => createLeaseId('550e8400-e29b-41d4-a716-446655440000'),
      (error: unknown) => error instanceof LeaseIdError
        && error.code === LeaseIdErrorCodes.Invalid,
    );
  });
});
