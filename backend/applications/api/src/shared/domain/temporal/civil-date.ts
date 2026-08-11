import { failure, success, type Result } from '@/shared/core/result';
import { ValueObject } from '@/shared/domain/value-object';

import { CivilDateErrorCodes, type CivilDateError } from './temporal-error';

interface CivilDateProps {
  readonly isoString: string;
}

const CIVIL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year: number, month: number): number {
  const days = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return days[month - 1] ?? 0;
}

export class CivilDate extends ValueObject<CivilDateProps, 'CivilDate'> {
  private constructor(isoString: string) {
    super({ isoString });
    Object.freeze(this);
  }

  static create(input: unknown): Result<CivilDate, CivilDateError> {
    if (typeof input !== 'string') {
      return failure({ code: CivilDateErrorCodes.InvalidType, field: 'civilDate' });
    }

    const match = CIVIL_DATE_PATTERN.exec(input);

    if (!match) {
      return failure({ code: CivilDateErrorCodes.InvalidFormat, field: 'civilDate' });
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    if (year === 0 || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
      return failure({ code: CivilDateErrorCodes.InvalidValue, field: 'civilDate' });
    }

    return success(new CivilDate(input));
  }

  compareTo(other: CivilDate): number {
    if (this.props.isoString === other.props.isoString) {
      return 0;
    }

    return this.props.isoString < other.props.isoString ? -1 : 1;
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
