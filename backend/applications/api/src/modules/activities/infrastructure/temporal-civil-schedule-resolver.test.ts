import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CivilDate, CivilTime, TimeZoneId } from '@/shared/domain/temporal';
import { CivilScheduleResolutionErrorCodes } from '../application';
import { TemporalCivilScheduleResolver } from './temporal-civil-schedule-resolver';

function value<T>(result: { success: true; value: T } | { success: false }): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('Invalid deterministic fixture');
  return result.value;
}

function input(date: string, time: string, disambiguation?: 'earlier' | 'later') {
  return {
    civilDate: value(CivilDate.create(date)),
    civilTime: value(CivilTime.create(time)),
    timeZoneId: value(TimeZoneId.create('America/New_York')),
    disambiguation,
  };
}

describe('TemporalCivilScheduleResolver', () => {
  it('resolves a normal civil schedule to one instant and offset', () => {
    const result = new TemporalCivilScheduleResolver().resolve(input('2021-02-01', '10:00'));
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.value.scheduledAt.toISOString(), '2021-02-01T15:00:00.000Z');
      assert.equal(result.value.resolvedOffset.toString(), '-05:00');
    }
  });

  it('rejects a local time skipped by a historical daylight-saving transition', () => {
    const result = new TemporalCivilScheduleResolver().resolve(input('2021-03-14', '02:30'));
    assert.equal(result.success, false);
    if (!result.success)
      assert.equal(result.error.code, CivilScheduleResolutionErrorCodes.NonexistentLocalTime);
  });

  it('requires an explicit choice when a historical local time occurred twice', () => {
    const resolver = new TemporalCivilScheduleResolver();
    const rejected = resolver.resolve(input('2021-11-07', '01:30'));
    assert.equal(rejected.success, false);
    if (!rejected.success)
      assert.equal(rejected.error.code, CivilScheduleResolutionErrorCodes.AmbiguousLocalTime);

    const earlier = resolver.resolve(input('2021-11-07', '01:30', 'earlier'));
    const later = resolver.resolve(input('2021-11-07', '01:30', 'later'));
    assert.equal(earlier.success, true);
    assert.equal(later.success, true);
    if (earlier.success && later.success) {
      assert.equal(earlier.value.scheduledAt.toISOString(), '2021-11-07T05:30:00.000Z');
      assert.equal(later.value.scheduledAt.toISOString(), '2021-11-07T06:30:00.000Z');
    }
  });
});
