import type {
  GetOrganizationDetailsError,
  OrganizationDetails,
} from '@/modules/organizations/application';
import type { OrganizationIdError } from '@/modules/organizations/domain';
import type { ExecutionContext } from '@/shared/application/context';
import type { Result } from '@/shared/core/result';
import {
  presentError,
  type MessageTranslator,
  type PresentedError,
  type SupportedLocale,
} from '@/shared/presentation';

export type GetOrganizationDetailsView =
  | Readonly<{ kind: 'success'; resource: Readonly<{ id: string; name: string }> }>
  | Readonly<{ kind: 'failure'; error: PresentedError }>;

export class GetOrganizationDetailsPresenter {
  constructor(private readonly translator: MessageTranslator) {}
  present(
    result: Result<OrganizationDetails, OrganizationIdError | GetOrganizationDetailsError>,
    context: ExecutionContext,
    locale: SupportedLocale,
  ): GetOrganizationDetailsView {
    if (!result.success)
      return Object.freeze({
        kind: 'failure',
        error: presentError(result.error, context, locale, this.translator),
      });
    return Object.freeze({
      kind: 'success',
      resource: Object.freeze({ id: result.value.id.toString(), name: result.value.name }),
    });
  }
}
