import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  TeamMembershipAssignmentPolicy,
  TeamMembershipAssignmentPolicyErrorCodes,
} from './team-membership-assignment-policy';
describe('TeamMembershipAssignmentPolicy', () => {
  const policy = new TeamMembershipAssignmentPolicy();
  it('allows an active ministry membership to join an active team once', () =>
    assert.equal(
      policy.evaluate({
        teamIsActive: true,
        ministryMembershipIsActive: true,
        activeTeamMembershipExists: false,
      }).success,
      true,
    ));
  it('rejects an inactive ministry membership', () => {
    const result = policy.evaluate({
      teamIsActive: true,
      ministryMembershipIsActive: false,
      activeTeamMembershipExists: false,
    });
    assert.equal(
      result.success ? undefined : result.error.code,
      TeamMembershipAssignmentPolicyErrorCodes.MinistryMembershipNotActive,
    );
  });
  it('rejects an active duplicate', () => {
    const result = policy.evaluate({
      teamIsActive: true,
      ministryMembershipIsActive: true,
      activeTeamMembershipExists: true,
    });
    assert.equal(
      result.success ? undefined : result.error.code,
      TeamMembershipAssignmentPolicyErrorCodes.ActiveMembershipAlreadyExists,
    );
  });
});
