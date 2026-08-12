import { OrganizationId, type OrganizationIdError } from '@/modules/organizations/domain';
import type { ExecutionContext } from '@/shared/application/context';
import { defineMessage } from '@/shared/application/mediator';
import { combineValidationResults, type ValidationErrors } from '@/shared/application/validation';
import { failure, success, type Result } from '@/shared/core/result';
import type { MinistryId, MinistryStatus } from '../../domain';

export interface MinistryListItem {
  readonly id: MinistryId;
  readonly name: string;
  readonly status: MinistryStatus;
}

export interface MinistryPage {
  readonly items: readonly MinistryListItem[];
  readonly pagination: Readonly<{
    readonly page: number;
    readonly pageSize: number;
    readonly totalItems: number;
    readonly totalPages: number;
  }>;
}

export interface MinistryListCriteria {
  readonly organizationId: OrganizationId;
  readonly page: number;
  readonly pageSize: number;
  readonly search?: string;
  readonly status?: MinistryStatus;
}

export interface MinistryListReader {
  list(criteria: MinistryListCriteria): Promise<MinistryPage | undefined>;
}

export interface ListMinistriesQuery {
  readonly organizationId: unknown;
  readonly page?: unknown;
  readonly pageSize?: unknown;
  readonly search?: unknown;
  readonly status?: unknown;
}

export const ListMinistriesErrorCodes = {
  InvalidPage: 'ministry.list.page.invalid',
  InvalidPageSize: 'ministry.list.page_size.invalid',
  InvalidSearch: 'ministry.list.search.invalid',
  InvalidStatus: 'ministry.list.status.invalid',
  OrganizationNotFound: 'ministry.list.organization_not_found',
} as const;

export interface ListMinistriesError {
  readonly code: (typeof ListMinistriesErrorCodes)[keyof typeof ListMinistriesErrorCodes];
  readonly field: 'organizationId' | 'page' | 'pageSize' | 'search' | 'status';
  readonly parameters?: Readonly<Record<string, string | number>>;
}

function positiveInteger(value: unknown, fallback: number): number | undefined {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const parsed = Number(String(value).trim());
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function pageResult(value: unknown): Result<number, ListMinistriesError> {
  const parsed = positiveInteger(value, 1);
  return parsed === undefined
    ? failure({ code: ListMinistriesErrorCodes.InvalidPage, field: 'page' })
    : success(parsed);
}

function pageSizeResult(value: unknown): Result<number, ListMinistriesError> {
  const parsed = positiveInteger(value, 20);
  return parsed === undefined || parsed > 100
    ? failure({
        code: ListMinistriesErrorCodes.InvalidPageSize,
        field: 'pageSize',
        parameters: { max: 100 },
      })
    : success(parsed);
}

function searchResult(value: unknown): Result<string | undefined, ListMinistriesError> {
  if (value === undefined || value === '') return success(undefined);
  if (typeof value !== 'string' || value.trim().length > 120)
    return failure({
      code: ListMinistriesErrorCodes.InvalidSearch,
      field: 'search',
      parameters: { max: 120 },
    });
  return success(value.trim() || undefined);
}

function statusResult(value: unknown): Result<MinistryStatus | undefined, ListMinistriesError> {
  if (value === undefined || value === '') return success(undefined);
  return value === 'active' || value === 'inactive'
    ? success(value)
    : failure({ code: ListMinistriesErrorCodes.InvalidStatus, field: 'status' });
}

export class ListMinistriesHandler {
  constructor(private readonly reader: MinistryListReader) {}

  async handle(
    query: ListMinistriesQuery,
    _context: ExecutionContext,
  ): Promise<Result<MinistryPage, OrganizationIdError | ListMinistriesError | ValidationErrors>> {
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
      ? failure({ code: ListMinistriesErrorCodes.OrganizationNotFound, field: 'organizationId' })
      : success(result);
  }
}

export const ListMinistriesMessage = defineMessage<
  ListMinistriesQuery,
  Awaited<ReturnType<ListMinistriesHandler['handle']>>
>('ministries.list-ministries', 'ListMinistries');
