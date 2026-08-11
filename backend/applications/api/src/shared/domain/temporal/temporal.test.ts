import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CivilDate,
  CivilDateErrorCodes,
  CivilTime,
  CivilTimeErrorCodes,
  SchedulePeriod,
  SchedulePeriodErrorCodes,
  TimeZoneId,
  TimeZoneIdErrorCodes,
} from '.';

function civilDate(input: string): CivilDate {
  const result = CivilDate.create(input);
  assert.equal(result.success, true);

  if (!result.success) {
    throw new Error('Expected a valid civil date fixture');
  }

  return result.value;
}

describe('CivilDate', () => {
  it('represents a valid Gregorian date without a timezone', () => {
    const result = CivilDate.create('2028-02-29');

    assert.equal(result.success, true);
    if (!result.success) return;

    assert.equal(result.value.toISOString(), '2028-02-29');
    assert.equal(result.value.toJSON(), '2028-02-29');
    assert.equal(Object.isFrozen(result.value), true);
  });

  it('compares dates by their civil order', () => {
    assert.equal(civilDate('2026-08-10').compareTo(civilDate('2026-08-11')), -1);
    assert.equal(civilDate('2026-08-11').compareTo(civilDate('2026-08-11')), 0);
  });

  it('rejects non-strings and non-canonical formats', () => {
    assert.deepEqual(CivilDate.create(new Date()), {
      success: false,
      error: { code: CivilDateErrorCodes.InvalidType, field: 'civilDate' },
    });
    assert.deepEqual(CivilDate.create('2026-8-01'), {
      success: false,
      error: { code: CivilDateErrorCodes.InvalidFormat, field: 'civilDate' },
    });
  });

  it('rejects impossible dates and the year zero', () => {
    for (const input of ['2026-02-29', '2026-04-31', '0000-01-01']) {
      assert.deepEqual(CivilDate.create(input), {
        success: false,
        error: { code: CivilDateErrorCodes.InvalidValue, field: 'civilDate' },
      });
    }
  });
});

describe('CivilTime', () => {
  it('accepts the complete range with minute precision', () => {
    for (const input of ['00:00', '23:59']) {
      const result = CivilTime.create(input);
      assert.equal(result.success, true);
      if (result.success) assert.equal(result.value.toISOString(), input);
    }
  });

  it('rejects seconds, non-canonical formats and values outside the range', () => {
    assert.deepEqual(CivilTime.create('10:30:00'), {
      success: false,
      error: { code: CivilTimeErrorCodes.InvalidFormat, field: 'civilTime' },
    });
    assert.deepEqual(CivilTime.create('24:00'), {
      success: false,
      error: { code: CivilTimeErrorCodes.InvalidValue, field: 'civilTime' },
    });
  });
});

describe('TimeZoneId', () => {
  it('accepts and preserves a canonical IANA timezone', () => {
    const result = TimeZoneId.create('America/Sao_Paulo');

    assert.equal(result.success, true);
    if (!result.success) return;

    assert.equal(result.value.toString(), 'America/Sao_Paulo');
    assert.equal(result.value.toJSON(), 'America/Sao_Paulo');
  });

  it('canonicalizes an IANA alias supported by the runtime', () => {
    const result = TimeZoneId.create('US/Eastern');

    assert.equal(result.success, true);
    if (!result.success) return;

    assert.equal(result.value.toString(), 'America/New_York');
  });

  it('rejects fixed offsets, surrounding whitespace and unknown zones', () => {
    assert.deepEqual(TimeZoneId.create('-03:00'), {
      success: false,
      error: { code: TimeZoneIdErrorCodes.InvalidFormat, field: 'timeZoneId' },
    });
    assert.deepEqual(TimeZoneId.create(' America/Sao_Paulo '), {
      success: false,
      error: { code: TimeZoneIdErrorCodes.InvalidFormat, field: 'timeZoneId' },
    });
    assert.deepEqual(TimeZoneId.create('America/Unknown_City'), {
      success: false,
      error: { code: TimeZoneIdErrorCodes.Unknown, field: 'timeZoneId' },
    });
  });
});

describe('SchedulePeriod', () => {
  it('represents an inclusive period', () => {
    const result = SchedulePeriod.create(civilDate('2026-08-01'), civilDate('2026-08-31'));

    assert.equal(result.success, true);
    if (!result.success) return;

    assert.equal(result.value.includes(civilDate('2026-08-01')), true);
    assert.equal(result.value.includes(civilDate('2026-08-31')), true);
    assert.equal(result.value.includes(civilDate('2026-09-01')), false);
  });

  it('accepts a single-day period', () => {
    const date = civilDate('2026-08-11');
    assert.equal(SchedulePeriod.create(date, date).success, true);
  });

  it('rejects a start date after the end date', () => {
    assert.deepEqual(SchedulePeriod.create(civilDate('2026-09-01'), civilDate('2026-08-31')), {
      success: false,
      error: {
        code: SchedulePeriodErrorCodes.StartAfterEnd,
        field: 'schedulePeriod',
      },
    });
  });
});
