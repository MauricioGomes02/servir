import type { GetMinistryDetailsError, MinistryDetails } from '../application';
import type { MinistryIdError } from '../domain';
import type { OrganizationIdError } from '@/modules/organizations/domain';
import type { ExecutionContext } from '@/shared/application/context';
import type { ValidationErrors } from '@/shared/application/validation';
import type { Result } from '@/shared/core/result';
import {
  presentErrorGroup,
  type MessageTranslator,
  type PresentedError,
  type SupportedLocale,
} from '@/shared/presentation';

export type GetMinistryDetailsView =
  | Readonly<{
      kind: 'success';
      resource: Readonly<{
        id: string;
        name: string;
        status: string;
        roles: readonly Readonly<{ id: string; name: string; status: string }>[];
      }>;
    }>
  | Readonly<{ kind: 'failure'; error: PresentedError; errors: readonly PresentedError[] }>;

export class GetMinistryDetailsPresenter {
  constructor(private readonly translator: MessageTranslator) {}

  present(
    result: Result<
      MinistryDetails,
      OrganizationIdError | MinistryIdError | GetMinistryDetailsError | ValidationErrors
    >,
    context: ExecutionContext,
    locale: SupportedLocale,
  ): GetMinistryDetailsView {
    if (!result.success)
      return Object.freeze({
        kind: 'failure',
        ...presentErrorGroup(result.error, context, locale, this.translator),
      });
    return Object.freeze({
      kind: 'success',
      resource: Object.freeze({
        id: result.value.id.toString(),
        name: result.value.name,
        status: result.value.status,
        roles: Object.freeze(
          result.value.roles.map((role) =>
            Object.freeze({ id: role.id.toString(), name: role.name, status: role.status }),
          ),
        ),
      }),
    });
  }
}
