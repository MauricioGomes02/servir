import { failure, success, type Result } from '@/shared/core/result';
import { isCanonicalUuid } from '@/shared/core/uuid';
import { EntityId } from '@/shared/domain/entity';
import type { NotificationError } from '@/shared/domain/notification';

export const MinistryRoleQualificationIdErrorCodes = {
  Invalid: 'ministry_role_qualification.id.invalid',
} as const;
export type MinistryRoleQualificationIdError = NotificationError<
  typeof MinistryRoleQualificationIdErrorCodes.Invalid
>;

export class MinistryRoleQualificationId extends EntityId<'MinistryRoleQualificationId'> {
  private constructor(value: string) {
    super(value);
  }
  static create(
    value: unknown,
  ): Result<MinistryRoleQualificationId, MinistryRoleQualificationIdError> {
    if (typeof value !== 'string' || !isCanonicalUuid(value.trim()))
      return failure({
        code: MinistryRoleQualificationIdErrorCodes.Invalid,
        field: 'ministryRoleQualificationId',
      });
    return success(new MinistryRoleQualificationId(value.trim()));
  }
}
