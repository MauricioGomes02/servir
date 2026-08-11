import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ActivityOccurrenceSchedulingErrorCodes,
  ActivityOccurrenceSchedulingPolicy,
} from './activity-occurrence-scheduling-policy';

describe('ActivityOccurrenceSchedulingPolicy', () => {
  const policy = new ActivityOccurrenceSchedulingPolicy();

  it('requires an active activity in the organization', () => {
    const result = policy.evaluate({ activityActive: false, scheduledAtExists: false });
    assert.equal(result.success, false);
    if (!result.success)
      assert.equal(result.error.code, ActivityOccurrenceSchedulingErrorCodes.ActivityNotActive);
  });

  it('prevents a duplicate current instant', () => {
    const result = policy.evaluate({ activityActive: true, scheduledAtExists: true });
    assert.equal(result.success, false);
    if (!result.success)
      assert.equal(
        result.error.code,
        ActivityOccurrenceSchedulingErrorCodes.ScheduledAtAlreadyExists,
      );
  });

  it('allows a new instant for an active activity', () => {
    assert.equal(policy.evaluate({ activityActive: true, scheduledAtExists: false }).success, true);
  });
});
