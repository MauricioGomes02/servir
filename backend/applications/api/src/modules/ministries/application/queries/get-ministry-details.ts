import { OrganizationId, type OrganizationIdError } from '@/modules/organizations/domain';
import type { ExecutionContext } from '@/shared/application/context';
import { defineMessage } from '@/shared/application/mediator';
import { combineValidationResults, type ValidationErrors } from '@/shared/application/validation';
import { failure, success, type Result } from '@/shared/core/result';
import {
  MinistryId,
  type MinistryIdError,
  type MinistryRoleId,
  type MinistryStatus,
} from '../../domain';

export interface MinistryRoleDetails {
  readonly id: MinistryRoleId;
  readonly name: string;
  readonly status: 'active' | 'inactive';
}

export interface MinistryDetails {
  readonly id: MinistryId;
  readonly name: string;
  readonly status: MinistryStatus;
  readonly roles: readonly MinistryRoleDetails[];
}

export interface MinistryDetailsReader {
  find(
    organizationId: OrganizationId,
    ministryId: MinistryId,
  ): Promise<MinistryDetails | undefined>;
}

export interface GetMinistryDetailsQuery {
  readonly organizationId: unknown;
  readonly ministryId: unknown;
}

export const GetMinistryDetailsErrorCodes = {
  MinistryNotFound: 'ministry.details.not_found',
} as const;

export interface GetMinistryDetailsError {
  readonly code: (typeof GetMinistryDetailsErrorCodes)[keyof typeof GetMinistryDetailsErrorCodes];
  readonly field: 'ministryId';
}

export class GetMinistryDetailsHandler {
  constructor(private readonly reader: MinistryDetailsReader) {}

  async handle(
    query: GetMinistryDetailsQuery,
    _context: ExecutionContext,
  ): Promise<
    Result<
      MinistryDetails,
      OrganizationIdError | MinistryIdError | GetMinistryDetailsError | ValidationErrors
    >
  > {
    const validated = combineValidationResults(
      OrganizationId.create(query.organizationId),
      MinistryId.create(query.ministryId),
    );
    if (!validated.success) return validated;
    const [organizationId, ministryId] = validated.value;
    const details = await this.reader.find(organizationId, ministryId);
    return details === undefined
      ? failure({ code: GetMinistryDetailsErrorCodes.MinistryNotFound, field: 'ministryId' })
      : success(details);
  }
}

export const GetMinistryDetailsMessage = defineMessage<
  GetMinistryDetailsQuery,
  Awaited<ReturnType<GetMinistryDetailsHandler['handle']>>
>('ministries.get-ministry-details', 'GetMinistryDetails');
