import type { ExecutionContext } from '@/shared/application/context';
import type { Result } from '@/shared/core/result';
import {
  presentError,
  type MessageTranslator,
  type PresentedError,
  type SupportedLocale,
} from '@/shared/presentation';
import type {
  ApproveMinistryMembershipOutput,
  ApproveMinistryMembershipNotFoundError,
} from '../../application';
import type { OrganizationIdError } from '@/modules/organizations/domain';
import type {
  MinistryIdError,
  MinistryMembershipApprovalError,
  MinistryMembershipIdError,
} from '../../domain';
type ApprovalError =
  | OrganizationIdError
  | MinistryIdError
  | MinistryMembershipIdError
  | MinistryMembershipApprovalError
  | ApproveMinistryMembershipNotFoundError;
export type ApproveMinistryMembershipView =
  | Readonly<{
      kind: 'success';
      resource: Readonly<{
        id: string;
        organizationId: string;
        ministryId: string;
        status: 'active';
      }>;
    }>
  | Readonly<{ kind: 'failure'; error: PresentedError }>;
export class ApproveMinistryMembershipPresenter {
  constructor(private readonly translator: MessageTranslator) {}
  present(
    result: Result<ApproveMinistryMembershipOutput, ApprovalError>,
    context: ExecutionContext,
    locale: SupportedLocale,
  ): ApproveMinistryMembershipView {
    if (!result.success)
      return Object.freeze({
        kind: 'failure',
        error: presentError(result.error, context, locale, this.translator),
      });
    return Object.freeze({
      kind: 'success',
      resource: Object.freeze({
        id: result.value.ministryMembershipId.value,
        organizationId: result.value.organizationId.value,
        ministryId: result.value.ministryId.value,
        status: result.value.status,
      }),
    });
  }
}
