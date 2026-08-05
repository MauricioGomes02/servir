import type {
  GetMemberDetailsError,
  MemberDetails,
} from '@/modules/membership/application';
import type { MemberIdError } from '@/modules/membership/domain';
import type { OrganizationIdError } from '@/modules/organizations/domain';
import type { ExecutionContext } from '@/shared/application/context';
import type { Result } from '@/shared/core/result';
import {
  presentError,
  type MessageTranslator,
  type PresentedError,
  type SupportedLocale,
} from '@/shared/presentation';

type GetMemberDetailsFailure = OrganizationIdError
  | MemberIdError
  | GetMemberDetailsError;

export type GetMemberDetailsView = Readonly<{
  kind: 'success';
  resource: Readonly<{
    id: string;
    organizationId: string;
    name: string;
    status: MemberDetails['status'];
  }>;
}> | Readonly<{
  kind: 'failure';
  error: PresentedError;
}>;

export class GetMemberDetailsPresenter {
  constructor(private readonly translator: MessageTranslator) {}

  present(
    result: Result<MemberDetails, GetMemberDetailsFailure>,
    context: ExecutionContext,
    locale: SupportedLocale,
  ): GetMemberDetailsView {
    if (!result.success) {
      return Object.freeze({
        kind: 'failure',
        error: presentError(result.error, context, locale, this.translator),
      });
    }

    return Object.freeze({
      kind: 'success',
      resource: Object.freeze({
        id: result.value.id.toString(),
        organizationId: result.value.organizationId.toString(),
        name: result.value.name,
        status: result.value.status,
      }),
    });
  }
}
