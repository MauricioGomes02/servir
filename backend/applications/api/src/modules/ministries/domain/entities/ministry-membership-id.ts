import { success, type Result } from '@/shared/core/result';
import { EntityId, validateEntityId } from '@/shared/domain/entity';
import {
  MinistryMembershipIdErrorCodes,
  type MinistryMembershipIdError,
} from './ministry-membership-id-error';

export class MinistryMembershipId extends EntityId<'MinistryMembershipId'> {
  private constructor(value: string) {
    super(value);
  }

  static create(value: unknown): Result<MinistryMembershipId, MinistryMembershipIdError> {
    const validated = validateEntityId(
      value,
      'ministryMembershipId',
      MinistryMembershipIdErrorCodes,
    );
    if (!validated.success) return validated;
    return success(new MinistryMembershipId(validated.value));
  }
}
