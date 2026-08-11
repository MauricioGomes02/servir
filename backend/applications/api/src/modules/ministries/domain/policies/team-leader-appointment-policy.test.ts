import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  TeamLeaderAppointmentPolicy,
  TeamLeaderAppointmentPolicyErrorCodes,
} from './team-leader-appointment-policy';

describe('TeamLeaderAppointmentPolicy', () => {
  const policy = new TeamLeaderAppointmentPolicy();

  it('allows an active team member to become the first active leader', () =>
    assert.equal(
      policy.evaluate({
        teamIsActive: true,
        teamMembershipIsActive: true,
        activeLeadershipExists: false,
      }).success,
      true,
    ));

  it('rejects a member without an active membership in the team', () => {
    const result = policy.evaluate({
      teamIsActive: true,
      teamMembershipIsActive: false,
      activeLeadershipExists: false,
    });
    assert.equal(
      result.success ? undefined : result.error.code,
      TeamLeaderAppointmentPolicyErrorCodes.TeamMembershipNotActive,
    );
  });

  it('rejects a second active leader', () => {
    const result = policy.evaluate({
      teamIsActive: true,
      teamMembershipIsActive: true,
      activeLeadershipExists: true,
    });
    assert.equal(
      result.success ? undefined : result.error.code,
      TeamLeaderAppointmentPolicyErrorCodes.ActiveLeadershipAlreadyExists,
    );
  });

  it('rejects an inactive team before evaluating its membership', () => {
    const result = policy.evaluate({
      teamIsActive: false,
      teamMembershipIsActive: true,
      activeLeadershipExists: false,
    });
    assert.equal(
      result.success ? undefined : result.error.code,
      TeamLeaderAppointmentPolicyErrorCodes.TeamNotActive,
    );
  });
});
