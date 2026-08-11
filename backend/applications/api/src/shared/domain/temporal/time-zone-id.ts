import { failure, success, type Result } from '@/shared/core/result';
import { ValueObject } from '@/shared/domain/value-object';

import { TimeZoneIdErrorCodes, type TimeZoneIdError } from './temporal-error';

interface TimeZoneIdProps {
  readonly value: string;
}

const FIXED_OFFSET_PATTERN = /^[+-]\d{2}:\d{2}$/;

// Intl requires a locale to construct the formatter. It does not affect timezone
// canonicalization, so a stable technical locale keeps validation deterministic.
const TIME_ZONE_VALIDATION_LOCALE = 'en';

export class TimeZoneId extends ValueObject<TimeZoneIdProps, 'TimeZoneId'> {
  private constructor(value: string) {
    super({ value });
    Object.freeze(this);
  }

  static create(input: unknown): Result<TimeZoneId, TimeZoneIdError> {
    if (typeof input !== 'string') {
      return failure({ code: TimeZoneIdErrorCodes.InvalidType, field: 'timeZoneId' });
    }

    if (input.length === 0 || input.trim() !== input || FIXED_OFFSET_PATTERN.test(input)) {
      return failure({ code: TimeZoneIdErrorCodes.InvalidFormat, field: 'timeZoneId' });
    }

    try {
      const canonical = new Intl.DateTimeFormat(TIME_ZONE_VALIDATION_LOCALE, {
        timeZone: input,
      }).resolvedOptions().timeZone;

      return success(new TimeZoneId(canonical));
    } catch (error: unknown) {
      if (error instanceof RangeError) {
        return failure({ code: TimeZoneIdErrorCodes.Unknown, field: 'timeZoneId' });
      }

      throw error;
    }
  }

  toString(): string {
    return this.props.value;
  }

  toJSON(): string {
    return this.props.value;
  }
}
