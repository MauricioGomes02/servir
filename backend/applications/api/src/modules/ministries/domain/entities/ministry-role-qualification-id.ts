import { success, type Result } from '@/shared/core/result';
import { EntityId, validateEntityId } from '@/shared/domain/entity';
import type { NotificationError } from '@/shared/domain/notification';

export const MinistryRoleQualificationIdErrorCodes = {
  InvalidType: 'ministry_role_qualification.id.invalid_type',
  Empty: 'ministry_role_qualification.id.empty',
  TooLong: 'ministry_role_qualification.id.too_long',
  InvalidFormat: 'ministry_role_qualification.id.invalid_format',
} as const;
export type MinistryRoleQualificationIdError = NotificationError<
  (typeof MinistryRoleQualificationIdErrorCodes)[keyof typeof MinistryRoleQualificationIdErrorCodes]
>;

export class MinistryRoleQualificationId extends EntityId<'MinistryRoleQualificationId'> {
  private constructor(value: string) {
    super(value);
  }
  static create(
    value: unknown,
  ): Result<MinistryRoleQualificationId, MinistryRoleQualificationIdError> {
    const validated = validateEntityId(
      value,
      'ministryRoleQualificationId',
      MinistryRoleQualificationIdErrorCodes,
    );
    if (!validated.success) return validated;
    return success(new MinistryRoleQualificationId(validated.value));
  }
}
