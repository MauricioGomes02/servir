import { failure, success, type Result } from '@/shared/core/result';
import { ValueObject } from '@/shared/domain/value-object';
import { normalizeName } from '@/shared/domain/name';

import { MemberNameErrorCodes, type MemberNameError } from './member-name-error';

const MAX_MEMBER_NAME_LENGTH = 120;

interface MemberNameProps {
  readonly value: string;
}

export class MemberName extends ValueObject<MemberNameProps, 'MemberName'> {
  private constructor(value: string) {
    super({ value });
    Object.freeze(this);
  }

  static create(input: unknown): Result<MemberName, MemberNameError> {
    if (typeof input !== 'string') {
      return failure({
        code: MemberNameErrorCodes.InvalidType,
        field: 'name',
      });
    }

    const value = normalizeName(input);

    if (value.length === 0) {
      return failure({
        code: MemberNameErrorCodes.Empty,
        field: 'name',
      });
    }

    if (value.length > MAX_MEMBER_NAME_LENGTH) {
      return failure({
        code: MemberNameErrorCodes.TooLong,
        field: 'name',
        params: {
          maxLength: MAX_MEMBER_NAME_LENGTH,
          actualLength: value.length,
        },
      });
    }

    return success(new MemberName(value));
  }

  toString(): string {
    return this.props.value;
  }

  toJSON(): string {
    return this.props.value;
  }
}
