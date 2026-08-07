import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MinistryMembershipRequestPolicy, MinistryMembershipRequestPolicyErrorCodes } from '.';

describe('MinistryMembershipRequestPolicy', () => {
  const policy = new MinistryMembershipRequestPolicy();
  it('allows a request for active resources without a current membership', () => {
    assert.equal(
      policy.evaluate({
        memberIsActive: true,
        ministryIsActive: true,
        currentMembershipExists: false,
      }).success,
      true,
    );
  });
  it('rejects each absent resource before checking membership conflict', () => {
    const member = policy.evaluate({
      memberIsActive: false,
      ministryIsActive: true,
      currentMembershipExists: false,
    });
    const ministry = policy.evaluate({
      memberIsActive: true,
      ministryIsActive: false,
      currentMembershipExists: false,
    });
    assert.equal(
      member.success ? undefined : member.error.code,
      MinistryMembershipRequestPolicyErrorCodes.MemberNotFound,
    );
    assert.equal(
      ministry.success ? undefined : ministry.error.code,
      MinistryMembershipRequestPolicyErrorCodes.MinistryNotFound,
    );
  });
  it('rejects a current requested or active membership', () => {
    const result = policy.evaluate({
      memberIsActive: true,
      ministryIsActive: true,
      currentMembershipExists: true,
    });
    assert.equal(
      result.success ? undefined : result.error.code,
      MinistryMembershipRequestPolicyErrorCodes.CurrentMembershipAlreadyExists,
    );
  });
});
