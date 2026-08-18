import type {
  AccessibleOrganizationListItem,
  ListAccessibleOrganizationsError,
} from '@/modules/organizations/application';
import type { ExecutionContext } from '@/shared/application/context';
import type { Result } from '@/shared/core/result';
import {
  presentError,
  type MessageTranslator,
  type PresentedError,
  type SupportedLocale,
} from '@/shared/presentation';

export type ListAccessibleOrganizationsView =
  | Readonly<{
      kind: 'success';
      resource: Readonly<{
        items: readonly Readonly<{ id: string; name: string }>[];
      }>;
    }>
  | Readonly<{ kind: 'failure'; error: PresentedError }>;

export class ListAccessibleOrganizationsPresenter {
  constructor(private readonly translator: MessageTranslator) {}

  present(
    result: Result<readonly AccessibleOrganizationListItem[], ListAccessibleOrganizationsError>,
    context: ExecutionContext,
    locale: SupportedLocale,
  ): ListAccessibleOrganizationsView {
    if (!result.success)
      return Object.freeze({
        kind: 'failure',
        error: presentError(result.error, context, locale, this.translator),
      });
    return Object.freeze({
      kind: 'success',
      resource: Object.freeze({
        items: Object.freeze(
          result.value.map((organization) =>
            Object.freeze({ id: organization.id.toString(), name: organization.name }),
          ),
        ),
      }),
    });
  }
}
