import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MinistryRoleQualificationErrorCodes } from '../entities';
import { MinistryRoleQualificationPolicy } from './ministry-role-qualification-policy';
describe('MinistryRoleQualificationPolicy', () => {
  it('requires an active membership and role without an active duplicate', () => {
    const policy = new MinistryRoleQualificationPolicy();
    assert.equal(
      policy.evaluate({
        membershipIsActive: true,
        roleIsActive: true,
        activeQualificationExists: false,
      }).success,
      true,
    );
    const inactiveRole = policy.evaluate({
      membershipIsActive: true,
      roleIsActive: false,
      activeQualificationExists: false,
    });
    assert.equal(
      inactiveRole.success ? undefined : inactiveRole.error.code,
      MinistryRoleQualificationErrorCodes.RoleNotActive,
    );
  });
});
