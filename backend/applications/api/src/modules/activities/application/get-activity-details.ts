import { OrganizationId, type OrganizationIdError } from '@/modules/organizations/domain';
import type { ExecutionContext } from '@/shared/application/context';
import { defineMessage } from '@/shared/application/mediator';
import { combineValidationResults, type ValidationErrors } from '@/shared/application/validation';
import { failure, success, type Result } from '@/shared/core/result';
import { ActivityId, type ActivityIdError, type ActivityStatus } from '../domain';

export interface ActivityMinistryDetails {
  readonly id: string;
  readonly name: string;
}

export interface ActivityDetails {
  readonly id: ActivityId;
  readonly name: string;
  readonly status: ActivityStatus;
  readonly ministries: readonly ActivityMinistryDetails[];
}

export interface ActivityDetailsReader {
  find(
    organizationId: OrganizationId,
    activityId: ActivityId,
  ): Promise<ActivityDetails | undefined>;
}

export interface GetActivityDetailsQuery {
  readonly organizationId: unknown;
  readonly activityId: unknown;
}

export const GetActivityDetailsErrorCodes = {
  ActivityNotFound: 'activity.details.not_found',
} as const;

export interface GetActivityDetailsError {
  readonly code: (typeof GetActivityDetailsErrorCodes)[keyof typeof GetActivityDetailsErrorCodes];
  readonly field: 'activityId';
}

export class GetActivityDetailsHandler {
  constructor(private readonly reader: ActivityDetailsReader) {}

  async handle(
    query: GetActivityDetailsQuery,
    _context: ExecutionContext,
  ): Promise<
    Result<
      ActivityDetails,
      OrganizationIdError | ActivityIdError | GetActivityDetailsError | ValidationErrors
    >
  > {
    const validated = combineValidationResults(
      OrganizationId.create(query.organizationId),
      ActivityId.create(query.activityId),
    );
    if (!validated.success) return validated;
    const [organizationId, activityId] = validated.value;
    const details = await this.reader.find(organizationId, activityId);
    return details === undefined
      ? failure({ code: GetActivityDetailsErrorCodes.ActivityNotFound, field: 'activityId' })
      : success(details);
  }
}

export const GetActivityDetailsMessage = defineMessage<
  GetActivityDetailsQuery,
  Awaited<ReturnType<GetActivityDetailsHandler['handle']>>
>('activities.get-activity-details', 'GetActivityDetails');
