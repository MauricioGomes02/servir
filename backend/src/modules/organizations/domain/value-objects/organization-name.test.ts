import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  OrganizationName,
  OrganizationNameErrorCodes,
} from '.';

describe('OrganizationName', () => {
  it('normaliza e representa um nome valido', () => {
    const result = OrganizationName.create('  Comunidade Servir  ');

    assert.equal(result.success, true);

    if (!result.success) {
      return;
    }

    assert.equal(result.value.toString(), 'Comunidade Servir');
    assert.equal(result.value.toJSON(), 'Comunidade Servir');
  });

  it('rejeita nome com tipo invalido', () => {
    const result = OrganizationName.create(null);

    assert.deepEqual(result, {
      success: false,
      error: {
        code: OrganizationNameErrorCodes.InvalidType,
        field: 'name',
      },
    });
  });

  it('rejeita nome vazio', () => {
    const result = OrganizationName.create('   ');

    assert.deepEqual(result, {
      success: false,
      error: {
        code: OrganizationNameErrorCodes.Empty,
        field: 'name',
      },
    });
  });

  it('limita o nome a 120 caracteres', () => {
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
