import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { failure, success } from '@/shared/core/result';
import { combineValidationResults } from './combine-validation-results';

describe('combineValidationResults', () => {
  it('returns every independently validated value in input order', () => {
    const result = combineValidationResults(success('organization'), success(42));
    assert.deepEqual(result, { success: true, value: ['organization', 42] });
  });

  it('accumulates every independent error and preserves the first as primary', () => {
    const result = combineValidationResults(
      failure({ code: 'organization.id.empty', field: 'organizationId' }),
      failure({ code: 'member.id.invalid_format', field: 'memberId' }),
    );
    assert.equal(result.success, false);
    if (result.success) return;
    assert.equal(result.error.code, 'organization.id.empty');
    assert.deepEqual(
      result.error.errors.map(({ code }) => code),
      ['organization.id.empty', 'member.id.invalid_format'],
    );
  });

  it('flattens nested validation groups without losing their errors', () => {
    const nestedErrors = [
      { code: 'item.invalid', field: 'items[0]' },
      { code: 'item.invalid', field: 'items[1]' },
    ] as const;
    const result = combineValidationResults(
      failure({ ...nestedErrors[0], errors: nestedErrors }),
      failure({ code: 'name.empty', field: 'name' }),
    );

    assert.equal(result.success, false);
    if (!result.success)
      assert.deepEqual(
        result.error.errors.map(({ code, field }) => ({ code, field })),
        [...nestedErrors, { code: 'name.empty', field: 'name' }],
      );
  });
});
