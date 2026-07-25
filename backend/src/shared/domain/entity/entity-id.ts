import {
  v7 as uuidV7,
  validate as validateUuid,
  version as getUuidVersion,
} from 'uuid';

import {
  failure,
  success,
  type Result,
} from '@/shared/core/result';

import {
  EntityIdErrorCodes,
  type EntityIdError,
} from './entity-id-error-codes';

export abstract class EntityId<
  TBrand extends string,
> {
  declare private readonly __brand: TBrand;

  protected constructor(
    public readonly value: string,
  ) {}

  protected static generateValue(): string {
    return uuidV7();
  }

  protected static parseValue(
    input: unknown,
  ): Result<string, EntityIdError> {
    if (typeof input !== 'string') {
      return failure({
        code: EntityIdErrorCodes.InvalidType,
        field: 'id',
      });
    }

    const value = input.trim().toLowerCase();

    if (!validateUuid(value)) {
      return failure({
        code: EntityIdErrorCodes.InvalidFormat,
        field: 'id',
      });
    }

    const receivedVersion = getUuidVersion(value);

    if (receivedVersion !== 7) {
      return failure({
        code: EntityIdErrorCodes.InvalidVersion,
        field: 'id',
        params: {
          expectedVersion: 7,
          receivedVersion,
        },
      });
    }

    return success(value);
  }

  equals(
    other: EntityId<TBrand> | null | undefined,
  ): boolean {
    return other?.value === this.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }
}