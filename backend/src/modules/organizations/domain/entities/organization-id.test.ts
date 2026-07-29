import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  OrganizationId,
  OrganizationIdErrorCodes,
} from '.';

describe('OrganizationId', () => {
  it('normalizes a valid opaque identity', () => {
    const result = OrganizationId.create(' organization-123 ');

    assert.equal(result.success, true);

    if (!result.success) {
      return;
    }

    assert.equal(result.value.toString(), 'organization-123');
    assert.equal(result.value.toJSON(), 'organization-123');
  });

  it('rejects an identity with an invalid type', () => {
    const result = OrganizationId.create(123);

    assert.deepEqual(result, {
      success: false,
      error: {
        code: OrganizationIdErrorCodes.InvalidType,
        field: 'organizationId',
      },
    });
  });

  it('rejects an empty identity', () => {
    const result = OrganizationId.create('   ');

    assert.deepEqual(result, {
      success: false,
      error: {
        code: OrganizationIdErrorCodes.Empty,
        field: 'organizationId',
      },
    });
  });

  it('accepts an identity with exactly 128 characters', () => {
    const input = 'a'.repeat(128);

    const result = OrganizationId.create(input);

    assert.equal(result.success, true);

    if (!result.success) {
      return;
    }

    assert.equal(result.value.toString(), input);
  });

  it('rejects an identity longer than 128 characters', () => {
    const result = OrganizationId.create('a'.repeat(129));

    assert.equal(result.success, false);

    if (result.success) {
      return;
    }

    assert.deepEqual(result.error, {
      code: OrganizationIdErrorCodes.TooLong,
      field: 'organizationId',
      params: {
        maxLength: 128,
        actualLength: 129,
      },
    });
  });
});
