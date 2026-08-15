import { failure, success, type Result } from '@/shared/core/result';
import { isCanonicalUuid } from '@/shared/core/uuid';
import { EntityId } from '@/shared/domain/entity';

export const UserIdErrorCodes = {
  Empty: 'identity.user_id.empty',
  InvalidFormat: 'identity.user_id.invalid_format',
  InvalidType: 'identity.user_id.invalid_type',
  TooLong: 'identity.user_id.too_long',
} as const;

export interface UserIdError {
  readonly code: (typeof UserIdErrorCodes)[keyof typeof UserIdErrorCodes];
  readonly field: 'userId';
  readonly params?: Readonly<Record<string, number>>;
}

export class UserId extends EntityId<'UserId'> {
  private constructor(value: string) {
    super(value);
    Object.freeze(this);
  }

  static create(input: unknown): Result<UserId, UserIdError> {
    if (typeof input !== 'string') {
      return failure({ code: UserIdErrorCodes.InvalidType, field: 'userId' });
    }

    const value = input.trim();
    if (value.length === 0) return failure({ code: UserIdErrorCodes.Empty, field: 'userId' });
    if (value.length > 128) {
      return failure({
        code: UserIdErrorCodes.TooLong,
        field: 'userId',
        params: { maxLength: 128, actualLength: value.length },
      });
    }
    if (!isCanonicalUuid(value)) {
      return failure({ code: UserIdErrorCodes.InvalidFormat, field: 'userId' });
    }

    return success(new UserId(value.toLowerCase()));
  }
}
