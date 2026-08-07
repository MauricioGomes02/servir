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
import type { RequestMinistryMembershipOutput } from '../../application';
import type { MinistryIdError, MinistryMembershipRequestPolicyError } from '../../domain';

type RequestMinistryMembershipError =
  OrganizationIdError | MinistryIdError | MemberIdError | MinistryMembershipRequestPolicyError;
export type RequestMinistryMembershipView =
  | Readonly<{
      kind: 'success';
      resource: Readonly<{
        id: string;
        organizationId: string;
        ministryId: string;
        memberId: string;
        status: 'requested';
      }>;
    }>
  | Readonly<{ kind: 'failure'; error: PresentedError }>;

export class RequestMinistryMembershipPresenter {
  constructor(private readonly translator: MessageTranslator) {}
  present(
    result: Result<RequestMinistryMembershipOutput, RequestMinistryMembershipError>,
    context: ExecutionContext,
    locale: SupportedLocale,
  ): RequestMinistryMembershipView {
    if (!result.success)
      return Object.freeze({
        kind: 'failure',
        error: presentError(result.error, context, locale, this.translator),
      });
    return Object.freeze({
      kind: 'success',
      resource: Object.freeze({
        id: result.value.ministryMembershipId.toString(),
        organizationId: result.value.organizationId.toString(),
        ministryId: result.value.ministryId.toString(),
        memberId: result.value.memberId.toString(),
        status: result.value.status,
      }),
    });
  }
}
