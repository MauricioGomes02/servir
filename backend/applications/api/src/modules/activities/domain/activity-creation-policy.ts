import type { MinistryId } from '@/modules/ministries/domain';
import { failure, success, type Result } from '@/shared/core/result';
import type { NotificationError } from '@/shared/domain/notification';

export interface ActivityCreationFacts {
  readonly organizationExists: boolean;
  readonly activeNameExists: boolean;
  readonly activeMinistryIds: ReadonlySet<string>;
}

export const ActivityCreationErrorCodes = {
  OrganizationNotFound: 'activity.creation.organization_not_found',
  ActiveNameAlreadyExists: 'activity.creation.active_name_already_exists',
  MinistriesRequired: 'activity.creation.ministries_required',
  DuplicateMinistry: 'activity.creation.duplicate_ministry',
  MinistryNotActive: 'activity.creation.ministry_not_active',
} as const;
export type ActivityCreationError = NotificationError<
  (typeof ActivityCreationErrorCodes)[keyof typeof ActivityCreationErrorCodes]
>;

export class ActivityCreationPolicy {
  validateParticipants(ministryIds: readonly MinistryId[]): Result<void, ActivityCreationError> {
    if (ministryIds.length === 0)
      return failure({ code: ActivityCreationErrorCodes.MinistriesRequired, field: 'ministryIds' });
    if (new Set(ministryIds.map((id) => id.toString())).size !== ministryIds.length)
      return failure({ code: ActivityCreationErrorCodes.DuplicateMinistry, field: 'ministryIds' });
    return success();
  }

  evaluate(
    facts: ActivityCreationFacts,
    ministryIds: readonly MinistryId[],
  ): Result<void, ActivityCreationError> {
    if (!facts.organizationExists)
      return failure({
        code: ActivityCreationErrorCodes.OrganizationNotFound,
        field: 'organizationId',
      });
    if (facts.activeNameExists) return failure(this.activeNameConflict());
    if (ministryIds.some((id) => !facts.activeMinistryIds.has(id.toString())))
      return failure({ code: ActivityCreationErrorCodes.MinistryNotActive, field: 'ministryIds' });
    return success();
  }

  activeNameConflict(): ActivityCreationError {
    return { code: ActivityCreationErrorCodes.ActiveNameAlreadyExists, field: 'name' };
  }
}
