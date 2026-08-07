import type { DefineMinistryRoleOutput, DefineMinistryRoleNotFoundError } from '../../application';
import type {
  MinistryIdError,
  MinistryRoleDefinitionError,
  MinistryRoleNameError,
} from '../../domain';
import type { OrganizationIdError } from '@/modules/organizations/domain';
import type { ExecutionContext } from '@/shared/application/context';
import type { Result } from '@/shared/core/result';
import {
  presentError,
  type MessageTranslator,
  type PresentedError,
  type SupportedLocale,
} from '@/shared/presentation';
type Error =
  | OrganizationIdError
  | MinistryIdError
  | MinistryRoleNameError
  | MinistryRoleDefinitionError
  | DefineMinistryRoleNotFoundError;
export type DefineMinistryRoleView =
  | Readonly<{
      kind: 'success';
      resource: Readonly<{
        id: string;
        ministryId: string;
        organizationId: string;
        name: string;
        status: 'active';
      }>;
    }>
  | Readonly<{ kind: 'failure'; error: PresentedError }>;
export class DefineMinistryRolePresenter {
  constructor(private readonly translator: MessageTranslator) {}
  present(
    result: Result<DefineMinistryRoleOutput, Error>,
    context: ExecutionContext,
    locale: SupportedLocale,
  ): DefineMinistryRoleView {
    if (!result.success)
      return Object.freeze({
        kind: 'failure',
        error: presentError(result.error, context, locale, this.translator),
      });
    return Object.freeze({
      kind: 'success',
      resource: Object.freeze({
        id: result.value.ministryRoleId.toString(),
        ministryId: result.value.ministryId.toString(),
        organizationId: result.value.organizationId.toString(),
        name: result.value.name,
        status: result.value.status,
      }),
    });
  }
}
