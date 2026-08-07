import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MinistryCreationPolicy, MinistryCreationPolicyErrorCodes } from '.';

describe('MinistryCreationPolicy', () => {
  const policy = new MinistryCreationPolicy();
  it('allows a new active name in an existing organization', () => {
    assert.deepEqual(policy.evaluate({ organizationExists: true, activeNameExists: false }), {
      success: true,
      value: undefined,
    });
  });
  it('rejects an unknown organization before name conflict', () => {
    const result = policy.evaluate({ organizationExists: false, activeNameExists: true });
    assert.equal(result.success, false);
    if (!result.success)
      assert.equal(result.error.code, MinistryCreationPolicyErrorCodes.OrganizationNotFound);
  });
  it('rejects an active duplicate name', () => {
    const result = policy.evaluate({ organizationExists: true, activeNameExists: true });
    assert.equal(result.success, false);
    if (!result.success)
      assert.equal(result.error.code, MinistryCreationPolicyErrorCodes.ActiveNameAlreadyExists);
  });
});
