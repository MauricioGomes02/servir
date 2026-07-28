import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  OrganizationId,
  OrganizationIdErrorCodes,
} from '.';

describe('OrganizationId', () => {
  it('normaliza uma identidade opaca valida', () => {
    const result = OrganizationId.create(' organization-123 ');

    assert.equal(result.success, true);

    if (!result.success) {
      return;
    }

    assert.equal(result.value.toString(), 'organization-123');
    assert.equal(result.value.toJSON(), 'organization-123');
  });

  it('rejeita identidade com tipo invalido', () => {
    const result = OrganizationId.create(123);

    assert.deepEqual(result, {
      success: false,
      error: {
        code: OrganizationIdErrorCodes.InvalidType,
        field: 'organizationId',
      },
    });
  });

  it('rejeita identidade vazia', () => {
    const result = OrganizationId.create('   ');

    assert.deepEqual(result, {
      success: false,
      error: {
        code: OrganizationIdErrorCodes.Empty,
        field: 'organizationId',
      },
    });
  });

  it('limita o tamanho da identidade', () => {
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
