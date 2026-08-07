import { failure, success, type Result } from '@/shared/core/result';
import { ValueObject } from '@/shared/domain/value-object';

import { InstantErrorCodes, type InstantError } from './instant-error';

interface InstantProps {
  readonly isoString: string;
}

export class Instant extends ValueObject<InstantProps, 'Instant'> {
  private constructor(isoString: string) {
    super({ isoString });
    Object.freeze(this);
  }

  static create(input: unknown): Result<Instant, InstantError> {
    if (typeof input !== 'string') {
      return failure({
        code: InstantErrorCodes.InvalidType,
        field: 'instant',
      });
    }

    const parsed = new Date(input);

    if (Number.isNaN(parsed.getTime()) || parsed.toISOString() !== input) {
      return failure({
        code: InstantErrorCodes.InvalidFormat,
        field: 'instant',
      });
    }

    return success(new Instant(input));
  }

  toEpochMilliseconds(): number {
    return Date.parse(this.props.isoString);
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
