import { failure, success, type Result } from '@/shared/core/result';
import { ValueObject } from '@/shared/domain/value-object';

import { MinistryNameErrorCodes, type MinistryNameError } from './ministry-name-error';

const MAX_MINISTRY_NAME_LENGTH = 120;

interface MinistryNameProps {
  readonly value: string;
}

export class MinistryName extends ValueObject<MinistryNameProps, 'MinistryName'> {
  private constructor(value: string) {
    super({ value });
    Object.freeze(this);
  }

  static create(input: unknown): Result<MinistryName, MinistryNameError> {
    if (typeof input !== 'string') {
      return failure({ code: MinistryNameErrorCodes.InvalidType, field: 'name' });
    }
    const value = input.trim();
    if (value.length === 0) {
      return failure({ code: MinistryNameErrorCodes.Empty, field: 'name' });
    }
    if (value.length > MAX_MINISTRY_NAME_LENGTH) {
      return failure({
        code: MinistryNameErrorCodes.TooLong,
        field: 'name',
        params: { maxLength: MAX_MINISTRY_NAME_LENGTH, actualLength: value.length },
      });
    }
    return success(new MinistryName(value));
  }

  toString(): string {
    return this.props.value;
  }
  toJSON(): string {
    return this.props.value;
  }
}
