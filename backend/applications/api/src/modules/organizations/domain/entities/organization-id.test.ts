import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { OrganizationId, OrganizationIdErrorCodes } from '.';

describe('OrganizationId', () => {
  const UUID_V7 = '0198f334-6dc5-7c20-9af1-91d7e599c7b1';

  it('normalizes a canonical UUID identity', () => {
    const result = OrganizationId.create(` ${UUID_V7.toUpperCase()} `);

    assert.equal(result.success, true);

    if (!result.success) {
      return;
    }

    assert.equal(result.value.toString(), UUID_V7);
    assert.equal(result.value.toJSON(), UUID_V7);
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

  it('rejects a non-UUID identity', () => {
    assert.deepEqual(OrganizationId.create('organization-123'), {
      success: false,
      error: {
        code: OrganizationIdErrorCodes.InvalidFormat,
        field: 'organizationId',
      },
    });
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
