import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  MinistryTeamCreationPolicy,
  MinistryTeamCreationPolicyErrorCodes,
} from './ministry-team-creation-policy';
describe('MinistryTeamCreationPolicy', () => {
  it('allows a unique name in an active ministry', () => {
    assert.equal(
      new MinistryTeamCreationPolicy().evaluate({ ministryIsActive: true, activeNameExists: false })
        .success,
      true,
    );
  });
  it('rejects an absent ministry before a duplicate name', () => {
    const result = new MinistryTeamCreationPolicy().evaluate({
      ministryIsActive: false,
      activeNameExists: true,
    });
    assert.equal(
      result.success ? undefined : result.error.code,
      MinistryTeamCreationPolicyErrorCodes.MinistryNotFound,
    );
  });
  it('rejects an active duplicate name', () => {
    const result = new MinistryTeamCreationPolicy().evaluate({
      ministryIsActive: true,
      activeNameExists: true,
    });
    assert.equal(
      result.success ? undefined : result.error.code,
      MinistryTeamCreationPolicyErrorCodes.ActiveNameAlreadyExists,
    );
  });
});
