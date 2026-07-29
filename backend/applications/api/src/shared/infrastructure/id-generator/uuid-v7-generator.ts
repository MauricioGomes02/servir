import type { IdGenerator } from '@/shared/application/id-generator';
import type { Result } from '@/shared/core/result';
import { v7 } from 'uuid';

import {
  UuidV7GeneratorError,
  UuidV7GeneratorErrorCodes,
} from './uuid-v7-generator-error';

export type IdFactory<TId, TError> = (
  input: unknown,
) => Result<TId, TError>;

export type UuidV7Source = () => string;

export class UuidV7Generator<TId, TError>
implements IdGenerator<TId> {
  constructor(
    private readonly idFactory: IdFactory<TId, TError>,
    private readonly source: UuidV7Source = v7,
  ) {}

  generate(): TId {
    let value: string;

    try {
      value = this.source();
    } catch (cause) {
      throw new UuidV7GeneratorError(
        UuidV7GeneratorErrorCodes.SourceFailed,
        cause,
      );
    }

    let result: Result<TId, TError>;

    try {
      result = this.idFactory(value);
    } catch (cause) {
      throw new UuidV7GeneratorError(
        UuidV7GeneratorErrorCodes.IdFactoryFailed,
        cause,
      );
    }

    if (!result.success) {
      throw new UuidV7GeneratorError(
        UuidV7GeneratorErrorCodes.GeneratedIdRejected,
        result.error,
      );
    }

    return result.value;
  }
}
