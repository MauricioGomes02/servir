import { failure, success, type Result } from '@/shared/core/result';
import { isCanonicalUuid } from '@/shared/core/uuid';
import { EntityId } from '@/shared/domain/entity';
import { MinistryRoleIdErrorCodes, type MinistryRoleIdError } from './ministry-role-id-error';

const MAX_LENGTH = 128;
export class MinistryRoleId extends EntityId<'MinistryRoleId'> {
  private constructor(value: string) { super(value); Object.freeze(this); }
  static create(input: unknown): Result<MinistryRoleId, MinistryRoleIdError> {
    if (typeof input !== 'string') return failure({ code: MinistryRoleIdErrorCodes.InvalidType, field: 'ministryRoleId' });
    const value = input.trim();
    if (value.length === 0) return failure({ code: MinistryRoleIdErrorCodes.Empty, field: 'ministryRoleId' });
    if (value.length > MAX_LENGTH) return failure({ code: MinistryRoleIdErrorCodes.TooLong, field: 'ministryRoleId', params: { maxLength: MAX_LENGTH, actualLength: value.length } });
    if (!isCanonicalUuid(value)) return failure({ code: MinistryRoleIdErrorCodes.InvalidFormat, field: 'ministryRoleId' });
    return success(new MinistryRoleId(value.toLowerCase()));
  }
}
