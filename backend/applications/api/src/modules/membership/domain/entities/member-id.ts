import {
  failure,
  success,
  type Result,
} from '@/shared/core/result';
import { isCanonicalUuid } from '@/shared/core/uuid';
import { EntityId } from '@/shared/domain/entity';

import {
  MemberIdErrorCodes,
  type MemberIdError,
} from './member-id-error';

const MAX_MEMBER_ID_LENGTH = 128;

export class MemberId extends EntityId<'MemberId'> {
  private constructor(value: string) {
    super(value);
    Object.freeze(this);
  }

  static create(input: unknown): Result<MemberId, MemberIdError> {
    if (typeof input !== 'string') {
      return failure({
        code: MemberIdErrorCodes.InvalidType,
        field: 'memberId',
      });
    }

    const value = input.trim();

    if (value.length === 0) {
      return failure({
        code: MemberIdErrorCodes.Empty,
        field: 'memberId',
      });
    }

    if (value.length > MAX_MEMBER_ID_LENGTH) {
      return failure({
        code: MemberIdErrorCodes.TooLong,
        field: 'memberId',
        params: {
          maxLength: MAX_MEMBER_ID_LENGTH,
          actualLength: value.length,
        },
      });
    }

    if (!isCanonicalUuid(value)) {
      return failure({
        code: MemberIdErrorCodes.InvalidFormat,
        field: 'memberId',
      });
    }

    return success(new MemberId(value.toLowerCase()));
  }
}
