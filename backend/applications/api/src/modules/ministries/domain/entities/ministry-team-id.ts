import { failure, success, type Result } from '@/shared/core/result';
import { isCanonicalUuid } from '@/shared/core/uuid';
import { EntityId } from '@/shared/domain/entity';
import type { NotificationError } from '@/shared/domain/notification';
export const MinistryTeamIdErrorCodes = { Invalid: 'ministry_team.id.invalid' } as const;
export type MinistryTeamIdError = NotificationError<typeof MinistryTeamIdErrorCodes.Invalid>;
export class MinistryTeamId extends EntityId<'MinistryTeamId'> {
  private constructor(value: string) {
    super(value);
  }
  static create(value: unknown): Result<MinistryTeamId, MinistryTeamIdError> {
    if (typeof value !== 'string' || !isCanonicalUuid(value.trim()))
      return failure({ code: MinistryTeamIdErrorCodes.Invalid, field: 'ministryTeamId' });
    return success(new MinistryTeamId(value.trim()));
  }
}
