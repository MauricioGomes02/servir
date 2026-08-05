import {
  MemberId,
  type MemberIdError,
} from '@/modules/membership/domain';
import {
  OrganizationId,
  type OrganizationIdError,
} from '@/modules/organizations/domain';
import { failure, type Result, success } from '@/shared/core/result';

import {
  GetMemberDetailsErrorCodes,
  type GetMemberDetailsError,
} from './get-member-details-error';
import type { GetMemberDetailsQuery } from './get-member-details-query';
import type { MemberDetails } from './member-details';
import type { MemberDetailsReader } from './member-details-reader';

type GetMemberDetailsFailure = OrganizationIdError
  | MemberIdError
  | GetMemberDetailsError;

export class GetMemberDetailsHandler {
  constructor(private readonly reader: MemberDetailsReader) {}

  async handle(
    query: GetMemberDetailsQuery,
  ): Promise<Result<MemberDetails, GetMemberDetailsFailure>> {
    const organizationId = OrganizationId.create(query.organizationId);

    if (!organizationId.success) {
      return organizationId;
    }

    const memberId = MemberId.create(query.memberId);

    if (!memberId.success) {
      return memberId;
    }

    const details = await this.reader.findById(
      organizationId.value,
      memberId.value,
    );

    return details === undefined
      ? failure({
        code: GetMemberDetailsErrorCodes.NotFound,
        field: 'memberId',
      })
      : success(details);
  }
}
