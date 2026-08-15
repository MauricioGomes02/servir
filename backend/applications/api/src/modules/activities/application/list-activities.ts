import { OrganizationId, type OrganizationIdError } from '@/modules/organizations/domain';
import type { ExecutionContext } from '@/shared/application/context';
import { defineMessage } from '@/shared/application/mediator';
import { combineValidationResults, type ValidationErrors } from '@/shared/application/validation';
import { failure, success, type Result } from '@/shared/core/result';
import type { ActivityId, ActivityStatus } from '../domain';

export interface ActivityListItem {
  readonly id: ActivityId;
  readonly name: string;
  readonly status: ActivityStatus;
  readonly ministryCount: number;
}

export interface ActivityPage {
  readonly items: readonly ActivityListItem[];
  readonly pagination: Readonly<{
    readonly page: number;
    readonly pageSize: number;
    readonly totalItems: number;
    readonly totalPages: number;
  }>;
}

export interface ActivityListCriteria {
  readonly organizationId: OrganizationId;
  readonly page: number;
  readonly pageSize: number;
  readonly search?: string;
  readonly status?: ActivityStatus;
}

export interface ActivityListReader {
  list(criteria: ActivityListCriteria): Promise<ActivityPage | undefined>;
}

export interface ListActivitiesQuery {
  readonly organizationId: unknown;
  readonly page?: unknown;
  readonly pageSize?: unknown;
  readonly search?: unknown;
  readonly status?: unknown;
}

export const ListActivitiesErrorCodes = {
  InvalidPage: 'activity.list.page.invalid',
  InvalidPageSize: 'activity.list.page_size.invalid',
  InvalidSearch: 'activity.list.search.invalid',
  InvalidStatus: 'activity.list.status.invalid',
  OrganizationNotFound: 'activity.list.organization_not_found',
} as const;

export interface ListActivitiesError {
  readonly code: (typeof ListActivitiesErrorCodes)[keyof typeof ListActivitiesErrorCodes];
  readonly field: 'organizationId' | 'page' | 'pageSize' | 'search' | 'status';
  readonly parameters?: Readonly<Record<string, string | number>>;
}

function positiveInteger(value: unknown, fallback: number): number | undefined {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const parsed = Number(String(value).trim());
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function pageResult(value: unknown): Result<number, ListActivitiesError> {
  const parsed = positiveInteger(value, 1);
  return parsed === undefined
    ? failure({ code: ListActivitiesErrorCodes.InvalidPage, field: 'page' })
    : success(parsed);
}

function pageSizeResult(value: unknown): Result<number, ListActivitiesError> {
  const parsed = positiveInteger(value, 20);
  return parsed === undefined || parsed > 100
    ? failure({
        code: ListActivitiesErrorCodes.InvalidPageSize,
        field: 'pageSize',
        parameters: { max: 100 },
      })
    : success(parsed);
}

function searchResult(value: unknown): Result<string | undefined, ListActivitiesError> {
  if (value === undefined || value === '') return success(undefined);
  if (typeof value !== 'string' || value.trim().length > 120)
    return failure({
      code: ListActivitiesErrorCodes.InvalidSearch,
      field: 'search',
      parameters: { max: 120 },
    });
  return success(value.trim() || undefined);
}

function statusResult(value: unknown): Result<ActivityStatus | undefined, ListActivitiesError> {
  if (value === undefined || value === '') return success(undefined);
  return value === 'active' || value === 'inactive'
    ? success(value)
    : failure({ code: ListActivitiesErrorCodes.InvalidStatus, field: 'status' });
}

export class ListActivitiesHandler {
  constructor(private readonly reader: ActivityListReader) {}

  async handle(
    query: ListActivitiesQuery,
    _context: ExecutionContext,
  ): Promise<Result<ActivityPage, OrganizationIdError | ListActivitiesError | ValidationErrors>> {
    const validated = combineValidationResults(
      OrganizationId.create(query.organizationId),
      pageResult(query.page),
      pageSizeResult(query.pageSize),
      searchResult(query.search),
      statusResult(query.status),
    );
    if (!validated.success) return validated;
    const [organizationId, page, pageSize, search, status] = validated.value;
    const result = await this.reader.list({
      organizationId,
      page,
      pageSize,
      ...(search === undefined ? {} : { search }),
      ...(status === undefined ? {} : { status }),
    });
    return result === undefined
      ? failure({ code: ListActivitiesErrorCodes.OrganizationNotFound, field: 'organizationId' })
      : success(result);
  }
}

export const ListActivitiesMessage = defineMessage<
  ListActivitiesQuery,
  Awaited<ReturnType<ListActivitiesHandler['handle']>>
>('activities.list-activities', 'ListActivities');
