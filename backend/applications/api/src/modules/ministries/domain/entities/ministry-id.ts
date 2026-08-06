import { failure, success, type Result } from '@/shared/core/result';
import { isCanonicalUuid } from '@/shared/core/uuid';
import { EntityId } from '@/shared/domain/entity';

import { MinistryIdErrorCodes, type MinistryIdError } from './ministry-id-error';

const MAX_MINISTRY_ID_LENGTH = 128;

export class MinistryId extends EntityId<'MinistryId'> {
  private constructor(value: string) {
    super(value);
    Object.freeze(this);
  }

  static create(input: unknown): Result<MinistryId, MinistryIdError> {
    if (typeof input !== 'string') {
      return failure({ code: MinistryIdErrorCodes.InvalidType, field: 'ministryId' });
    }

    const value = input.trim();
    if (value.length === 0) {
      return failure({ code: MinistryIdErrorCodes.Empty, field: 'ministryId' });
    }
    if (value.length > MAX_MINISTRY_ID_LENGTH) {
      return failure({
        code: MinistryIdErrorCodes.TooLong,
        field: 'ministryId',
        params: { maxLength: MAX_MINISTRY_ID_LENGTH, actualLength: value.length },
      });
    }
    if (!isCanonicalUuid(value)) {
      return failure({ code: MinistryIdErrorCodes.InvalidFormat, field: 'ministryId' });
    }

    return success(new MinistryId(value.toLowerCase()));
  }
}
