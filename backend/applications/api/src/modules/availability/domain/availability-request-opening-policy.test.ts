import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Instant } from '@/shared/domain/instant';
import {
  AvailabilityRequestOpeningErrorCodes,
  AvailabilityRequestOpeningPolicy,
} from './availability-request-opening-policy';

function instant(value: string) {
  const result = Instant.create(value);
  assert.equal(result.success, true);
  if (!result.success) throw new Error('Invalid deterministic fixture');
  return result.value;
}

describe('AvailabilityRequestOpeningPolicy', () => {
  const policy = new AvailabilityRequestOpeningPolicy();
  const now = instant('2026-08-11T12:00:00.000Z');

  it('requires an active ministry team in the organization', () => {
    const result = policy.evaluate({ teamActive: false }, instant('2026-08-12T12:00:00.000Z'), now);
    assert.equal(result.success, false);
    if (!result.success)
      assert.equal(result.error.code, AvailabilityRequestOpeningErrorCodes.TeamNotActive);
  });

  it('requires the response deadline to be strictly in the future', () => {
    for (const deadline of ['2026-08-11T11:59:59.999Z', '2026-08-11T12:00:00.000Z']) {
      const result = policy.evaluate({ teamActive: true }, instant(deadline), now);
      assert.equal(result.success, false);
      if (!result.success)
        assert.equal(
          result.error.code,
          AvailabilityRequestOpeningErrorCodes.ResponseDeadlineNotFuture,
        );
    }
  });

  it('allows a future deadline for an active team', () => {
    assert.equal(
      policy.evaluate({ teamActive: true }, instant('2026-08-11T12:00:00.001Z'), now).success,
      true,
    );
  });
});
