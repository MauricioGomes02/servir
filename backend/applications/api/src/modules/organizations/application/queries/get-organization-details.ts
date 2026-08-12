import { OrganizationId, type OrganizationIdError } from '@/modules/organizations/domain';
import type { ExecutionContext } from '@/shared/application/context';
import { defineMessage } from '@/shared/application/mediator';
import { failure, success, type Result } from '@/shared/core/result';

export interface OrganizationDetails {
  readonly id: OrganizationId;
  readonly name: string;
}

export interface OrganizationDetailsReader {
  findById(organizationId: OrganizationId): Promise<OrganizationDetails | undefined>;
}

export interface GetOrganizationDetailsQuery {
  readonly organizationId: unknown;
}

export const GetOrganizationDetailsErrorCodes = {
  NotFound: 'organization.details.not_found',
} as const;

export interface GetOrganizationDetailsError {
  readonly code: (typeof GetOrganizationDetailsErrorCodes)['NotFound'];
  readonly field: 'organizationId';
}

export class GetOrganizationDetailsHandler {
  constructor(private readonly reader: OrganizationDetailsReader) {}

  async handle(
    query: GetOrganizationDetailsQuery,
    _context: ExecutionContext,
  ): Promise<Result<OrganizationDetails, OrganizationIdError | GetOrganizationDetailsError>> {
    const organizationId = OrganizationId.create(query.organizationId);
    if (!organizationId.success) return organizationId;
    const details = await this.reader.findById(organizationId.value);
    return details === undefined
      ? failure({ code: GetOrganizationDetailsErrorCodes.NotFound, field: 'organizationId' })
      : success(Object.freeze(details));
  }
}

export const GetOrganizationDetailsMessage = defineMessage<
  GetOrganizationDetailsQuery,
  Awaited<ReturnType<GetOrganizationDetailsHandler['handle']>>
>('organizations.get-organization-details', 'GetOrganizationDetails');
