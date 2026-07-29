import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  OrganizationName,
  OrganizationNameErrorCodes,
} from '.';

describe('OrganizationName', () => {
  it('normalizes and represents a valid name', () => {
    const result = OrganizationName.create('  Comunidade Servir  ');

    assert.equal(result.success, true);

    if (!result.success) {
      return;
    }

    assert.equal(result.value.toString(), 'Comunidade Servir');
    assert.equal(result.value.toJSON(), 'Comunidade Servir');
  });

  it('rejects a name with an invalid type', () => {
    const result = OrganizationName.create(null);

    assert.deepEqual(result, {
      success: false,
      error: {
        code: OrganizationNameErrorCodes.InvalidType,
        field: 'name',
      },
    });
  });

  it('rejects an empty name', () => {
    const result = OrganizationName.create('   ');

    assert.deepEqual(result, {
      success: false,
      error: {
        code: OrganizationNameErrorCodes.Empty,
        field: 'name',
      },
    });
  });

  it('accepts a name with exactly 120 characters', () => {
    const input = 'a'.repeat(120);

    const result = OrganizationName.create(input);

    assert.equal(result.success, true);

    if (!result.success) {
      return;
    }

    assert.equal(result.value.toString(), input);
  });

  it('rejects a name longer than 120 characters', () => {
    const result = OrganizationName.create('a'.repeat(121));

    assert.equal(result.success, false);

    if (result.success) {
      return;
    }

    assert.deepEqual(result.error, {
      code: OrganizationNameErrorCodes.TooLong,
      field: 'name',
      params: {
        maxLength: 120,
        actualLength: 121,
      },
    });
  });
});
