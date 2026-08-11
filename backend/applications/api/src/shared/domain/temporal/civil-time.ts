import { failure, success, type Result } from '@/shared/core/result';
import { ValueObject } from '@/shared/domain/value-object';

import { CivilTimeErrorCodes, type CivilTimeError } from './temporal-error';

interface CivilTimeProps {
  readonly isoString: string;
}

const CIVIL_TIME_PATTERN = /^(\d{2}):(\d{2})$/;

export class CivilTime extends ValueObject<CivilTimeProps, 'CivilTime'> {
  private constructor(isoString: string) {
    super({ isoString });
    Object.freeze(this);
  }

  static create(input: unknown): Result<CivilTime, CivilTimeError> {
    if (typeof input !== 'string') {
      return failure({ code: CivilTimeErrorCodes.InvalidType, field: 'civilTime' });
    }

    const match = CIVIL_TIME_PATTERN.exec(input);

    if (!match) {
      return failure({ code: CivilTimeErrorCodes.InvalidFormat, field: 'civilTime' });
    }

    const hour = Number(match[1]);
    const minute = Number(match[2]);

    if (hour > 23 || minute > 59) {
      return failure({ code: CivilTimeErrorCodes.InvalidValue, field: 'civilTime' });
    }

    return success(new CivilTime(input));
  }

  toISOString(): string {
    return this.props.isoString;
  }

  toString(): string {
    return this.props.isoString;
  }

  toJSON(): string {
    return this.props.isoString;
  }
}
