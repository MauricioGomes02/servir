import { failure, success, type Result } from '@/shared/core/result';
import { isCanonicalUuid } from '@/shared/core/uuid';
import { EntityId } from '@/shared/domain/entity';
import {
  MinistryMembershipIdErrorCodes,
  type MinistryMembershipIdError,
} from './ministry-membership-id-error';

const maximumLength = 128;

export class MinistryMembershipId extends EntityId<'MinistryMembershipId'> {
  private constructor(value: string) {
    super(value);
  }

  static create(value: unknown): Result<MinistryMembershipId, MinistryMembershipIdError> {
    if (typeof value !== 'string')
      return failure({
        code: MinistryMembershipIdErrorCodes.InvalidType,
        field: 'ministryMembershipId',
      });
    const normalized = value.trim();
    if (normalized.length === 0)
      return failure({ code: MinistryMembershipIdErrorCodes.Empty, field: 'ministryMembershipId' });
    if (normalized.length > maximumLength)
      return failure({
        code: MinistryMembershipIdErrorCodes.TooLong,
        field: 'ministryMembershipId',
        parameters: { maxLength: maximumLength },
      });
    if (!isCanonicalUuid(normalized))
      return failure({
        code: MinistryMembershipIdErrorCodes.InvalidFormat,
        field: 'ministryMembershipId',
      });
    return success(new MinistryMembershipId(normalized));
  }
}
