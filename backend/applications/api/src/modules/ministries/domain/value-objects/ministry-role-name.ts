import { failure, success, type Result } from '@/shared/core/result';
import { ValueObject } from '@/shared/domain/value-object';
import { normalizeName } from '@/shared/domain/name';
import { MinistryRoleNameErrorCodes, type MinistryRoleNameError } from './ministry-role-name-error';

const MAX_LENGTH = 120;
interface Props {
  readonly value: string;
}
export class MinistryRoleName extends ValueObject<Props, 'MinistryRoleName'> {
  private constructor(value: string) {
    super({ value });
    Object.freeze(this);
  }
  static create(input: unknown): Result<MinistryRoleName, MinistryRoleNameError> {
    if (typeof input !== 'string')
      return failure({ code: MinistryRoleNameErrorCodes.InvalidType, field: 'name' });
    const value = normalizeName(input);
    if (value.length === 0)
      return failure({ code: MinistryRoleNameErrorCodes.Empty, field: 'name' });
    if (value.length > MAX_LENGTH)
      return failure({
        code: MinistryRoleNameErrorCodes.TooLong,
        field: 'name',
        params: { maxLength: MAX_LENGTH, actualLength: value.length },
      });
    return success(new MinistryRoleName(value));
  }
  toString(): string {
    return this.props.value;
  }
  toJSON(): string {
    return this.props.value;
  }
}
