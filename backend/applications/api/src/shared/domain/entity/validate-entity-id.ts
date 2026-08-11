import { failure, success, type Result } from '@/shared/core/result';
import { isCanonicalUuid } from '@/shared/core/uuid';
import type { NotificationError } from '@/shared/domain/notification';

export interface EntityIdErrorCodes<TCode extends string> {
  readonly InvalidType: TCode;
  readonly Empty: TCode;
  readonly TooLong: TCode;
  readonly InvalidFormat: TCode;
}

export function validateEntityId<TCode extends string>(
  input: unknown,
  field: string,
  codes: EntityIdErrorCodes<TCode>,
  maxLength = 128,
): Result<string, NotificationError<TCode>> {
  if (typeof input !== 'string') return failure({ code: codes.InvalidType, field });
  const value = input.trim();
  if (value.length === 0) return failure({ code: codes.Empty, field });
  if (value.length > maxLength)
    return failure({
      code: codes.TooLong,
      field,
      params: { maxLength, actualLength: value.length },
    });
  if (!isCanonicalUuid(value)) return failure({ code: codes.InvalidFormat, field });
  return success(value.toLowerCase());
}
