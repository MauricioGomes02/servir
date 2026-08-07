import { failure, success, type Result } from '@/shared/core/result';
import { ValueObject } from '@/shared/domain/value-object';

import { OrganizationNameErrorCodes, type OrganizationNameError } from './organization-name-error';

const MAX_ORGANIZATION_NAME_LENGTH = 120;

interface OrganizationNameProps {
  readonly value: string;
}

export class OrganizationName extends ValueObject<OrganizationNameProps, 'OrganizationName'> {
  private constructor(value: string) {
    super({ value });
    Object.freeze(this);
  }

  static create(input: unknown): Result<OrganizationName, OrganizationNameError> {
    if (typeof input !== 'string') {
      return failure({
        code: OrganizationNameErrorCodes.InvalidType,
        field: 'name',
      });
    }

    const value = input.trim();

    if (value.length === 0) {
      return failure({
        code: OrganizationNameErrorCodes.Empty,
        field: 'name',
      });
    }

    if (value.length > MAX_ORGANIZATION_NAME_LENGTH) {
      return failure({
        code: OrganizationNameErrorCodes.TooLong,
        field: 'name',
        params: {
          maxLength: MAX_ORGANIZATION_NAME_LENGTH,
          actualLength: value.length,
        },
      });
    }

    return success(new OrganizationName(value));
  }

  toString(): string {
    return this.props.value;
  }

  toJSON(): string {
    return this.props.value;
  }
}
