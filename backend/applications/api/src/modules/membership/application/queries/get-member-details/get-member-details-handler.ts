import { MemberId, type MemberIdError } from '@/modules/membership/domain';
import { OrganizationId, type OrganizationIdError } from '@/modules/organizations/domain';
import { failure, type Result, success } from '@/shared/core/result';
import { combineValidationResults, type ValidationErrors } from '@/shared/application/validation';
import type { ExecutionContext } from '@/shared/application/context';
import {
  createLogRecord,
  LogLevels,
  type Logger,
  type LogAttributes,
} from '@/shared/application/logging';

import { GetMemberDetailsErrorCodes, type GetMemberDetailsError } from './get-member-details-error';
import type { GetMemberDetailsQuery } from './get-member-details-query';
import type { MemberDetails } from './member-details';
import type { MemberDetailsReader } from './member-details-reader';

type GetMemberDetailsFailure =
  OrganizationIdError | MemberIdError | GetMemberDetailsError | ValidationErrors;

export class GetMemberDetailsHandler {
  constructor(
    private readonly reader: MemberDetailsReader,
    private readonly logger: Logger,
  ) {}

  async handle(
    query: GetMemberDetailsQuery,
    context: ExecutionContext,
  ): Promise<Result<MemberDetails, GetMemberDetailsFailure>> {
    this.log('member.details.retrieval.started', context, {}, LogLevels.Debug);
    const validated = combineValidationResults(
      OrganizationId.create(query.organizationId),
      MemberId.create(query.memberId),
    );
    if (!validated.success) return validated;
    const [organizationId, memberId] = validated.value;

    const criteria = {
      'organization.id': organizationId.value,
      'member.id': memberId.value,
    };
    this.log('member.details.retrieval.criteria_validated', context, criteria, LogLevels.Debug);

    const details = await this.reader.findById(organizationId, memberId);

    if (details === undefined) {
      this.log('member.details.retrieval.not_found', context, criteria, LogLevels.Info);
      return failure({
        code: GetMemberDetailsErrorCodes.NotFound,
        field: 'memberId',
      });
    }

    this.log('member.details.retrieval.completed', context, criteria, LogLevels.Info);
    return success(details);
  }

  private logRejection(
    context: ExecutionContext,
    code: string,
    field?: string,
    attributes: LogAttributes = {},
  ): void {
    this.log(
      'member.details.retrieval.rejected',
      context,
      {
        ...attributes,
        'error.code': code,
        ...(field === undefined ? {} : { 'error.field': field }),
      },
      LogLevels.Info,
    );
  }

  private log(
    eventName: string,
    context: ExecutionContext,
    attributes: LogAttributes,
    level: typeof LogLevels.Debug | typeof LogLevels.Info,
  ): void {
    this.logger.log(createLogRecord({ level, eventName, context, attributes }));
  }
}
