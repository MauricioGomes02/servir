import { OrganizationId, type OrganizationIdError } from '@/modules/organizations/domain';
import type { ExecutionContext } from '@/shared/application/context';
import { defineMessage } from '@/shared/application/mediator';
import { combineValidationResults, type ValidationErrors } from '@/shared/application/validation';
import { failure, success, type Result } from '@/shared/core/result';
import type { MemberId, MemberStatus } from '../../../domain';

export interface MemberListItem {
  readonly id: MemberId;
  readonly name: string;
  readonly status: MemberStatus;
}

export interface MemberPage {
  readonly items: readonly MemberListItem[];
  readonly pagination: Readonly<{
    readonly page: number;
    readonly pageSize: number;
    readonly totalItems: number;
    readonly totalPages: number;
  }>;
}

export interface MemberListCriteria {
  readonly organizationId: OrganizationId;
  readonly page: number;
  readonly pageSize: number;
  readonly search?: string;
  readonly status?: MemberStatus;
}

export interface MemberListReader {
  list(criteria: MemberListCriteria): Promise<MemberPage | undefined>;
}

export interface ListMembersQuery {
  readonly organizationId: unknown;
  readonly page?: unknown;
  readonly pageSize?: unknown;
  readonly search?: unknown;
  readonly status?: unknown;
}

export const ListMembersErrorCodes = {
  InvalidPage: 'member.list.page.invalid',
  InvalidPageSize: 'member.list.page_size.invalid',
  InvalidSearch: 'member.list.search.invalid',
  InvalidStatus: 'member.list.status.invalid',
  OrganizationNotFound: 'member.list.organization_not_found',
} as const;

export interface ListMembersError {
  readonly code: (typeof ListMembersErrorCodes)[keyof typeof ListMembersErrorCodes];
  readonly field: 'organizationId' | 'page' | 'pageSize' | 'search' | 'status';
  readonly parameters?: Readonly<Record<string, string | number>>;
}

function positiveInteger(value: unknown, fallback: number): number | undefined {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const parsed = Number(String(value).trim());
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function pageResult(value: unknown): Result<number, ListMembersError> {
  const parsed = positiveInteger(value, 1);
  return parsed === undefined
    ? failure({ code: ListMembersErrorCodes.InvalidPage, field: 'page' })
    : success(parsed);
}

function pageSizeResult(value: unknown): Result<number, ListMembersError> {
  const parsed = positiveInteger(value, 20);
  return parsed === undefined || parsed > 100
    ? failure({
        code: ListMembersErrorCodes.InvalidPageSize,
        field: 'pageSize',
        parameters: { max: 100 },
      })
    : success(parsed);
}

function searchResult(value: unknown): Result<string | undefined, ListMembersError> {
  if (value === undefined || value === '') return success(undefined);
  if (typeof value !== 'string' || value.trim().length > 120)
    return failure({
      code: ListMembersErrorCodes.InvalidSearch,
      field: 'search',
      parameters: { max: 120 },
    });
  return success(value.trim() || undefined);
}

function statusResult(value: unknown): Result<MemberStatus | undefined, ListMembersError> {
  if (value === undefined || value === '') return success(undefined);
  return value === 'active' || value === 'inactive'
    ? success(value)
    : failure({ code: ListMembersErrorCodes.InvalidStatus, field: 'status' });
}

export class ListMembersHandler {
  constructor(private readonly reader: MemberListReader) {}

  async handle(
    query: ListMembersQuery,
    _context: ExecutionContext,
  ): Promise<Result<MemberPage, OrganizationIdError | ListMembersError | ValidationErrors>> {
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
      ? failure({ code: ListMembersErrorCodes.OrganizationNotFound, field: 'organizationId' })
      : success(result);
  }
}

export const ListMembersMessage = defineMessage<
  ListMembersQuery,
  Awaited<ReturnType<ListMembersHandler['handle']>>
>('membership.list-members', 'ListMembers');
